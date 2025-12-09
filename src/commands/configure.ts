import { Command, Prompt } from "@effect/cli";
import { Effect, Console, Layer, Redacted } from "effect";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { CredentialsService } from "@/services/credentials.js";
import { ConfigService } from "@/services/config.js";
import { fetchProviderModels } from "@/utils/models.js";
import { Credentials } from "@/schema.js";
import { NAME } from "@/constants.js";

const PROVIDER_CHOICES = [
  { title: "OpenAI", value: "openai" as const },
  { title: "Anthropic (Claude)", value: "anthropic" as const },
  { title: "Google (Gemini)", value: "google" as const },
  { title: "GitHub Models", value: "github-models" as const },
] as const;

const configureCommand = Command.make("configure", {}, () =>
  Effect.gen(function* () {
    yield* Console.log(
      "This wizard will help you set up your AI provider credentials and preferences.\n",
    );

    // Step 1: Select provider
    const provider = yield* Prompt.select({
      message: "Select your AI provider:",
      choices: PROVIDER_CHOICES,
    });

    // Step 2: Get API key
    const apiKey = yield* Prompt.password({
      message: `Enter your ${PROVIDER_CHOICES.find((p) => p.value === provider)?.title} API key:`,
      validate: (input) => {
        if (!input || input.trim().length === 0) {
          return Effect.fail("API key cannot be empty");
        }
        return Effect.succeed(input);
      },
    });

    // Step 3: Fetch available models for the provider
    yield* Console.log(`\nFetching available models for ${provider}...\n`);

    const models = yield* fetchProviderModels(provider).pipe(
      Effect.catchAll((error) => {
        // If fetching models fails, continue without model selection
        return Effect.gen(function* () {
          yield* Console.error(`⚠️  Failed to fetch models: ${error.message}`);
          yield* Console.log(
            "Continuing with configuration. You can set the default model manually later.\n",
          );
          return [];
        });
      }),
    );

    let selectedModel: string | undefined;

    if (models.length > 0) {
      // Step 4: Select default model
      const modelChoices = models.map((model) => ({
        title: `${model.name} (${model.id})`,
        value: model.id,
      }));

      selectedModel = yield* Prompt.select({
        message: "Select your default model:",
        choices: modelChoices,
      });
    }

    // Step 5: Confirm before saving
    const confirm = yield* Prompt.confirm({
      message: "\nSave these settings?",
      initial: true,
    });

    if (!confirm) {
      yield* Console.log("\n❌ Configuration cancelled.\n");
      return;
    }

    // Step 6: Save credentials
    const credentialsService = yield* CredentialsService;
    const currentCredentials = yield* credentialsService.getCredentials();

    const updatedCredentials: Credentials = {
      ...currentCredentials,
      [provider]: Redacted.value(apiKey),
    };

    yield* credentialsService.saveCredentials(updatedCredentials);

    // Step 7: Save config (if model was selected)
    if (selectedModel) {
      const configService = yield* ConfigService;

      const updatedConfig = {
        model: selectedModel,
        provider: provider,
      };

      yield* configService.saveConfig(updatedConfig);
      yield* Console.log(
        `\nℹ️  Default model set to: ${selectedModel} (provider: ${provider})`,
      );
    }

    yield* Console.log("\n✅ Configuration saved successfully!\n");
    yield* Console.log(
      `You can now use ${NAME} with your configured provider.\n`,
    );
  }).pipe(
    Effect.provide(
      Layer.mergeAll(
        CredentialsService.Default,
        ConfigService.Default,
        NodeFileSystem.layer,
        NodePath.layer,
      ),
    ),
  ),
);

export { configureCommand };

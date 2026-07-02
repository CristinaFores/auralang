# Disclaimer

AuraLang is provided "as is", without warranty of any kind, express or implied. See [LICENSE](./LICENSE) for the full legal terms.

## Translation and transcription accuracy

AuraLang uses a small, local Whisper model (`whisper-tiny`) for speech recognition and an unofficial Google Translate endpoint for translation. Both can and will produce inaccurate, incomplete, or mistranslated output, especially with background noise, overlapping speakers, accents, or fast speech. Do not rely on AuraLang for contexts where translation accuracy is critical (medical, legal, safety-related, or similar).

## No affiliation

AuraLang is an independent, unofficial project. It is not affiliated with, endorsed by, or sponsored by OpenAI, Google, or Hugging Face. "Whisper" and "Google Translate" are used here only to describe the third-party technologies this extension relies on.

## Third-party services

- **Whisper model weights** are downloaded from Hugging Face (huggingface.co) and run entirely on your device.
- **Translation** is sent to Google's public, unofficial `translate.googleapis.com` endpoint. This is not Google's official paid Cloud Translation API — it has no uptime guarantee and its availability or terms may change without notice. See [PRIVACY.md](./PRIVACY.md) for what data this involves.

Use of these third-party services is subject to their own respective terms, which AuraLang does not control.

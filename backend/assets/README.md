# Brand assets

## cosmoplex-logo.(svg|png|jpg)

Drop the official Cosmoplex logo here with one of these exact names:

    cosmoplex-logo.svg     (best - vector, stays sharp at print size)
    cosmoplex-logo.png     (transparent background, 800px+ wide)
    cosmoplex-logo.jpg

`agents/certifier.py` picks it up automatically via `_logo_data_uri()` and
embeds it in the certificate's navy header band. No code change needed.

Notes:
- The header band already supplies the navy background, so a logo carrying its
  own dark rectangle will look like a box inside a box. Prefer transparent.
- If no file is present (or it cannot be read) the certificate falls back to the
  typographic COSMOPLEX wordmark. A missing logo must never block issuing a
  learner's certificate.
- The file is embedded as a data URI, so certificate rendering never makes a
  network request.

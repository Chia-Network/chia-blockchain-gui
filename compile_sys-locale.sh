#!/bin/bash

# Extract the locale (up to the first '.')
LOCALE=$(echo $LANG | sed 's/\..*$//')

# Check if the extracted locale is empty
if [ -z "$LOCALE" ]; then
  echo "Locale could not be determined."
  exit 1
fi

# Extract messages for all locales
lingui extract

# Compile messages for the determined locale
lingui compile --locale $LOCALE

echo "Compiled locales for: $LOCALE"

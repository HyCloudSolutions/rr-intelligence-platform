#!/bin/bash
while IFS='=' read -r key value; do
  [[ $key =~ ^#.* ]] || [[ -z $key ]] && continue
  echo "Adding $key..."
  echo "$value" | vercel env add "$key" production
done < .env.production

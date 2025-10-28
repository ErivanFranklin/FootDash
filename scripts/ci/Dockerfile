FROM node:20-bullseye-slim

# Install Chromium for headless browser tests
RUN apt-get update \
  && apt-get install -y --no-install-recommends chromium \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
WORKDIR /workspace

# Default entrypoint will open a shell; scripts will be mounted/ran by helper script
CMD ["/bin/bash"]

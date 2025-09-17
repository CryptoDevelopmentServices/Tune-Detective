FROM ubuntu:22.04

# Build args for flexibility
ARG DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y   curl git unzip openjdk-11-jdk python3 python3-pip   build-essential ruby-full cocoapods   && rm -rf /var/lib/apt/lists/*

# Install Node + Expo CLI
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&     apt-get install -y nodejs &&     npm install -g expo-cli

# Install Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
RUN mkdir -p ${ANDROID_SDK_ROOT} && cd ${ANDROID_SDK_ROOT} &&     curl -o sdk-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip &&     unzip sdk-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools &&     rm sdk-tools.zip &&     yes | ${ANDROID_SDK_ROOT}/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT} --licenses &&     ${ANDROID_SDK_ROOT}/cmdline-tools/bin/sdkmanager --sdk_root=${ANDROID_SDK_ROOT}       "platform-tools" "platforms;android-33" "build-tools;33.0.2"

ENV PATH=$PATH:${ANDROID_SDK_ROOT}/platform-tools

# Copy entrypoint script (OS detection handled at runtime)
WORKDIR /usr/src/app
COPY entrypoint.sh /usr/src/app/entrypoint.sh
RUN chmod +x /usr/src/app/entrypoint.sh

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 19000 19001 19002 19006
ENTRYPOINT ["/usr/src/app/entrypoint.sh"]

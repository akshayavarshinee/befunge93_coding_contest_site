# Minimal Docker image for Befunge-93 execution
FROM node:20-alpine

# Create workspace directory first
RUN mkdir -p /workspace
WORKDIR /workspace
RUN npm init -y

# Create non-root user for execution
RUN addgroup -S befunge && adduser -S befunge -G befunge
RUN chown -R befunge:befunge /workspace

# Switch to non-root user
USER befunge

WORKDIR /workspace

# Set NODE_PATH so Node.js can find modules
ENV NODE_PATH=/workspace/node_modules

# Entry point: run befunge code from stdin or file
CMD ["sh"]

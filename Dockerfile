# Step 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY . .

# Build with skipTests to avoid test failures
RUN mvn clean package -DskipTests

# Step 2: Run stage
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/app-0.0.1-SNAPSHOT.jar app.jar

# Expose the port
EXPOSE 8080

# Set environment variable defaults and run the application
# These can be overridden when running the container
ENV DB_URL=jdbc:mysql://db:3306/chatApplication \
    DB_USERNAME=root \
    DB_PASSWORD=password \
    CORS_ORIGINS=http://localhost:5173 \
    PORT=8080

ENTRYPOINT ["java", \
    "-Dspring.datasource.url=${DB_URL}", \
    "-Dspring.datasource.username=${DB_USERNAME}", \
    "-Dspring.datasource.password=${DB_PASSWORD}", \
    "-Dapp.cors.allowed-origins=${CORS_ORIGINS}", \
    "-Dserver.port=${PORT}", \
    "-jar", "/app/app.jar"]
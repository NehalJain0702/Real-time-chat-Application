# Step 1: Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Step 2: Run stage
FROM eclipse-temurin:21-jdk

WORKDIR /app
COPY --from=build /app/target/app-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app/app.jar"]
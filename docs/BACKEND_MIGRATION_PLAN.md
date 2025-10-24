# Backend Migration Plan: Admin Panel SMA

## Migration from NestJS to Golang

**Document Version**: 1.0  
**Created**: 24 Oktober 2025  
**Status**: Planning Phase

---

## 📋 Executive Summary

Dokumen ini merupakan panduan lengkap migrasi backend Admin Panel SMA dari arsitektur monolitik NestJS ke microservices berbasis Golang. Migrasi dilakukan secara bertahap (phased approach) untuk meminimalkan risiko dan memastikan sistem tetap berjalan selama proses migrasi.

### Tujuan Migrasi

- **Performance**: Meningkatkan performa API dengan concurrency Golang
- **Scalability**: Memisahkan services untuk scaling independen
- **Maintainability**: Codebase yang lebih sederhana dan mudah di-maintain
- **Type Safety**: Strongly typed dengan compile-time checks
- **Resource Efficiency**: Lower memory footprint dan CPU usage

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (Golang)                      │
│              - Authentication & Authorization               │
│              - Rate Limiting                                │
│              - Request Routing                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────┬──────────┐
        ▼                     ▼          ▼          ▼
┌──────────────┐  ┌──────────────┐  ┌────────┐  ┌────────┐
│ Academic Svc │  │ Student Svc  │  │ HR Svc │  │ ...    │
│              │  │              │  │        │  │        │
│ - Grades     │  │ - Students   │  │ - Tchr │  │        │
│ - Schedules  │  │ - Classes    │  │ - Stf  │  │        │
│ - Subjects   │  │ - Enrollment │  │        │  │        │
└──────┬───────┘  └──────┬───────┘  └────┬───┘  └────┬───┘
       │                 │               │           │
       └─────────────────┴───────────────┴───────────┘
                         │
                         ▼
              ┌────────────────────┐
              │   PostgreSQL DB    │
              │ (Existing Schema)  │
              └────────────────────┘
```

---

## 📊 Current System Analysis

### Existing Features (From Frontend & NestJS Backend)

#### 1. **Authentication & Authorization**

- Login/Logout
- JWT Token Management
- Role-based Access Control (RBAC)
- Session Management
- Password Reset/Change

#### 2. **Academic Management**

- **Terms (Semester)**
  - CRUD operations
  - Active term management
- **Subjects**
  - CRUD operations
  - Track-based subjects (IPA/IPS)
  - Subject groups (CORE/DIFFERENTIATED/ELECTIVE)
- **Classes**
  - CRUD operations
  - Homeroom assignment
  - Class-subject mapping
- **Schedules**
  - CRUD operations
  - Schedule generation
  - Conflict detection
  - Room management

#### 3. **Student Management**

- **Students**
  - CRUD operations
  - Enrollment management
  - Status tracking (active/inactive)
  - Guardian information
- **Enrollment**
  - Class enrollment
  - Term enrollment
  - Enrollment history

#### 4. **Teacher & Staff Management**

- **Teachers**
  - CRUD operations
  - Subject assignment
  - Preference management
- **Users**
  - User management
  - Role assignment

#### 5. **Assessment & Grading**

- **Grade Components**
  - CRUD operations
  - Weight configuration
  - KKM (Minimum passing grade)
- **Grade Configs**
  - Scheme configuration (WEIGHTED/AVERAGE)
  - Status management (draft/finalized)
- **Grades**
  - CRUD operations
  - Bulk grade entry
  - Grade calculation
  - Report generation

#### 6. **Attendance Management**

- **Daily Attendance**
  - Mark attendance (H/S/I/A)
  - Bulk attendance entry
  - Attendance reports
- **Subject Attendance**
  - Per-session attendance
  - Teacher reporting

#### 7. **Communication & Information**

- **Announcements**
  - CRUD operations
  - Audience targeting (ALL/GURU/SISWA/CLASS)
  - Pinned announcements
- **Behavior Notes**
  - CRUD operations
  - Category-based notes
- **Calendar Events**
  - CRUD operations
  - Category-based events
  - Exam scheduling

#### 8. **Administrative**

- **Mutations (Student Transfers)**
  - IN/OUT/INTERNAL transfers
  - Audit trail
- **Archives**
  - Report generation
  - File downloads
- **Dashboard Analytics**
  - Grade distribution
  - Attendance statistics
  - Outliers detection
  - Remedial tracking

#### 9. **System Configuration**

- School settings
- Term configuration
- System parameters

---

## 🎯 Migration Phases Overview

Migration akan dibagi menjadi **6 Phase** dengan durasi total estimasi **16-20 minggu**:

| Phase       | Focus Area                 | Duration  | Status      |
| ----------- | -------------------------- | --------- | ----------- |
| **Phase 0** | Setup & Infrastructure     | 2 weeks   | 📋 Planning |
| **Phase 1** | Auth & Core APIs           | 3 weeks   | ⏳ Pending  |
| **Phase 2** | Academic Management        | 3 weeks   | ⏳ Pending  |
| **Phase 3** | Student & Assessment       | 3 weeks   | ⏳ Pending  |
| **Phase 4** | Attendance & Communication | 3 weeks   | ⏳ Pending  |
| **Phase 5** | Analytics & Optimization   | 2-3 weeks | ⏳ Pending  |
| **Phase 6** | Legacy Decommission        | 1-2 weeks | ⏳ Pending  |

---

## 📦 Phase 0: Setup & Infrastructure (Week 1-2)

### Objectives

- Setup development environment
- Define project structure
- Setup CI/CD pipeline
- Database migration strategy
- Testing infrastructure

### Deliverables

#### 1. Project Structure

```
admin-panel-sma-backend/
├── cmd/
│   ├── api-gateway/           # Main API Gateway
│   ├── academic-service/      # Academic microservice
│   ├── student-service/       # Student microservice
│   ├── hr-service/           # HR/Teacher microservice
│   └── analytics-service/    # Analytics microservice
├── internal/
│   ├── auth/                 # Authentication pkg
│   ├── middleware/           # Middlewares
│   ├── models/              # Domain models
│   ├── repository/          # Data access layer
│   ├── service/             # Business logic
│   └── utils/               # Utilities
├── pkg/
│   ├── config/              # Configuration
│   ├── database/            # DB connections
│   ├── logger/              # Logging
│   ├── cache/               # Redis cache
│   └── errors/              # Error handling
├── api/
│   ├── proto/               # gRPC definitions (optional)
│   └── openapi/             # OpenAPI/Swagger specs
├── migrations/              # DB migrations
├── scripts/                 # Helper scripts
├── docker/                  # Docker configs
│   ├── Dockerfile.gateway
│   ├── Dockerfile.academic
│   └── docker-compose.yml
├── tests/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── api/                 # API documentation
├── .github/
│   └── workflows/           # GitHub Actions
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

#### 2. Technology Stack

**Core Framework & Libraries:**

```go
// Web Framework
github.com/gin-gonic/gin              // HTTP router
github.com/swaggo/gin-swagger         // Swagger docs

// Database
github.com/jmoiron/sqlx               // SQL extensions
github.com/lib/pq                     // PostgreSQL driver
github.com/golang-migrate/migrate     // DB migrations

// Authentication
github.com/golang-jwt/jwt/v5          // JWT tokens
golang.org/x/crypto/bcrypt            // Password hashing

// Validation
github.com/go-playground/validator/v10 // Request validation

// Configuration
github.com/spf13/viper                // Config management
github.com/joho/godotenv              // Environment vars

// Logging
go.uber.org/zap                       // Structured logging

// Cache
github.com/redis/go-redis/v9          // Redis client

// Testing
github.com/stretchr/testify           // Test assertions
github.com/DATA-DOG/go-sqlmock        // SQL mocking

// Utils
github.com/google/uuid                // UUID generation
github.com/rs/cors                    // CORS handling
```

**Optional (Future Enhancement):**

```go
// gRPC (for inter-service communication)
google.golang.org/grpc
google.golang.org/protobuf

// Observability
go.opentelemetry.io/otel              // Tracing
github.com/prometheus/client_golang   // Metrics
```

#### 3. Database Strategy

**Option A: Shared Database (Recommended for Phase 0-3)**

- Continue using existing PostgreSQL schema
- All services connect to same database
- Easier migration path
- Data consistency guaranteed

**Option B: Database per Service (Future)**

- Separate databases per microservice
- True service independence
- Requires data synchronization strategy

**Migration Tools:**

```bash
# golang-migrate
migrate create -ext sql -dir migrations -seq initial_schema

# Example migration
migrations/
├── 000001_initial_schema.up.sql
├── 000001_initial_schema.down.sql
├── 000002_add_indexes.up.sql
└── 000002_add_indexes.down.sql
```

#### 4. Development Environment Setup

**Prerequisites:**

```bash
# Required installations
- Go 1.21+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose
- Make
- Air (hot reload) - optional

# Install tools
go install github.com/swaggo/swag/cmd/swag@latest
go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
go install github.com/cosmtrek/air@latest
```

**Environment Variables Template:**

```env
# .env.example
# Server
PORT=8080
ENV=development
API_PREFIX=/api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=admin_panel_sma
DB_SSL_MODE=disable
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=168h

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads

# Email (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
```

#### 5. Docker Setup

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: sma_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: admin_panel_sma
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: sma_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway (will be added in Phase 1)
  # api-gateway:
  #   build:
  #     context: .
  #     dockerfile: docker/Dockerfile.gateway
  #   container_name: sma_api_gateway
  #   ports:
  #     - "8080:8080"
  #   environment:
  #     - PORT=8080
  #     - DB_HOST=postgres
  #     - REDIS_HOST=redis
  #   depends_on:
  #     - postgres
  #     - redis

volumes:
  postgres_data:
```

#### 6. Makefile

```makefile
.PHONY: help setup dev build test migrate-up migrate-down docker-up docker-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

setup: ## Initial setup
	go mod download
	go install github.com/swaggo/swag/cmd/swag@latest
	go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	cp .env.example .env

dev: ## Run development server with hot reload
	air

build: ## Build all services
	go build -o bin/api-gateway ./cmd/api-gateway

test: ## Run tests
	go test -v -cover ./...

test-coverage: ## Run tests with coverage report
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

migrate-create: ## Create new migration (usage: make migrate-create name=migration_name)
	migrate create -ext sql -dir migrations -seq $(name)

migrate-up: ## Run migrations up
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/admin_panel_sma?sslmode=disable" up

migrate-down: ## Run migrations down
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/admin_panel_sma?sslmode=disable" down

migrate-force: ## Force migration version (usage: make migrate-force version=1)
	migrate -path migrations -database "postgresql://postgres:postgres@localhost:5432/admin_panel_sma?sslmode=disable" force $(version)

docker-up: ## Start docker containers
	docker-compose up -d

docker-down: ## Stop docker containers
	docker-compose down

docker-logs: ## Show docker logs
	docker-compose logs -f

swag: ## Generate swagger documentation
	swag init -g cmd/api-gateway/main.go -o api/swagger

lint: ## Run linter
	golangci-lint run

clean: ## Clean build artifacts
	rm -rf bin/
	rm -rf coverage.*

.DEFAULT_GOAL := help
```

### Week 1 Tasks Checklist

- [ ] Initialize Go project (`go mod init`)
- [ ] Create project structure
- [ ] Setup Docker & Docker Compose
- [ ] Configure PostgreSQL connection
- [ ] Configure Redis connection
- [ ] Setup logging (zap)
- [ ] Setup configuration management (viper)
- [ ] Create Makefile
- [ ] Setup CI/CD (GitHub Actions)
- [ ] Write initial documentation

### Week 2 Tasks Checklist

- [ ] Create database migration scripts
- [ ] Setup testing infrastructure
- [ ] Create base models/entities
- [ ] Setup error handling
- [ ] Create middleware structure
- [ ] Setup API documentation (Swagger)
- [ ] Create health check endpoint
- [ ] Write unit tests for utilities
- [ ] Setup code quality tools (linter)
- [ ] Team training on Go basics

---

## 🔐 Phase 1: Authentication & User Management (Week 3-5)

**Status**: 📋 Documented  
**Detailed Documentation**: [PHASE_1_AUTH_USER_MANAGEMENT.md](./PHASE_1_AUTH_USER_MANAGEMENT.md)

### Overview

- Implement authentication system (login/logout)
- JWT token generation & validation
- Role-based access control (RBAC)
- User management APIs (CRUD)
- Establish base patterns for all future APIs

### Key Deliverables

- 12 API endpoints (auth + user management)
- JWT middleware with role-based access
- Refresh token management
- Audit logging system
- Repository-Service-Handler architecture

### Success Metrics

- Response time < 100ms
- 100% test coverage for auth flows
- Zero downtime during migration

**👉 [View Full Phase 1 Documentation](./PHASE_1_AUTH_USER_MANAGEMENT.md)**

---

## 📚 Phase 2: Academic Management (Week 6-8)

**Status**: 📋 Documented  
**Detailed Documentation**: [PHASE_2_ACADEMIC_MANAGEMENT.md](./PHASE_2_ACADEMIC_MANAGEMENT.md)

### Overview

- Terms (Semester) management
- Subjects CRUD with track-based filtering
- Classes management with homeroom assignments
- Schedule management with conflict detection
- Class-subject mapping

### Key Deliverables

- 27 API endpoints across 4 domains
- Schedule conflict detection algorithm
- Bulk operations support
- Multi-perspective schedule views (class/teacher)

### Success Metrics

- Response time < 150ms
- 100% conflict detection accuracy
- Bulk operations handle 100+ items

**👉 [View Full Phase 2 Documentation](./PHASE_2_ACADEMIC_MANAGEMENT.md)**

---

**👉 [View Full Phase 2 Documentation](./PHASE_2_ACADEMIC_MANAGEMENT.md)**

---

## 📝 Phase 3: Student Management & Assessment (Week 9-11)

**Status**: ⏳ Pending Documentation

### Planned Scope

- Students CRUD operations
- Enrollment management (class & term)
- Grade components & configurations
- Grade entry & calculations
- Report generation

### Estimated Deliverables

- ~25 API endpoints
- Student enrollment workflows
- Grade calculation engine
- Report PDF generation

**Documentation**: Coming soon

---

## 📊 Phase 4: Attendance & Communication (Week 12-14)

**Status**: ⏳ Pending Documentation

### Planned Scope

- Daily attendance tracking
- Subject attendance per session
- Announcements system
- Behavior notes
- Calendar events

### Estimated Deliverables

- ~20 API endpoints
- Attendance reporting
- Multi-audience announcements
- Event scheduling

**Documentation**: Coming soon

---

## 📈 Phase 5: Analytics & Optimization (Week 15-17)

**Status**: ⏳ Pending Documentation

### Planned Scope

- Dashboard analytics
- Grade distribution analysis
- Attendance statistics
- Outlier detection
- Performance optimization

### Estimated Deliverables

- Analytics aggregation APIs
- Caching layer implementation
- Query optimization
- Report generation optimization

**Documentation**: Coming soon

---

## 🔄 Phase 6: Legacy Decommission (Week 18-20)

**Status**: ⏳ Pending Documentation

### Planned Scope

- Full migration validation
- NestJS backend shutdown
- Data cleanup & archival
- Production monitoring
- Team training

### Estimated Deliverables

- Migration completion report
- Performance benchmarks
- Updated documentation
- Training materials

**Documentation**: Coming soon

---

## 📚 Next Steps

### Current Status

- ✅ Phase 0: Infrastructure setup planned
- ✅ Phase 1: Authentication documented ([Details](./PHASE_1_AUTH_USER_MANAGEMENT.md))
- ✅ Phase 2: Academic management documented ([Details](./PHASE_2_ACADEMIC_MANAGEMENT.md))
- ⏳ Phase 3-6: Awaiting documentation

### Immediate Actions

1. Review Phase 1 & 2 documentation
2. Begin Phase 0 implementation (infrastructure setup)
3. Prepare Phase 3 documentation (Student & Assessment)
4. Setup development environment per Phase 0 guidelines

---

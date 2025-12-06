# 배포 가이드

이 문서는 Simplab 프로젝트를 Cloudtype(프론트엔드)과 Railway(백엔드, MySQL)에 배포하는 방법을 설명합니다.

## 배포 구조

- **React 프론트엔드** → Cloudtype
- **Node.js 백엔드** → Railway
- **MySQL 데이터베이스** → Railway

---

## 1단계: Railway MySQL 데이터베이스 설정

### 1.1 Railway 프로젝트 생성

1. [Railway 대시보드](https://railway.app)에 로그인
2. "New Project" 클릭
3. "New" → "Database" → "Add MySQL" 선택
4. MySQL 서비스가 생성되면 자동으로 연결 정보가 제공됩니다

### 1.2 MySQL 연결 정보 확인

Railway MySQL 서비스의 "Variables" 탭에서 다음 환경 변수를 확인하세요:

- `MYSQLHOST` - 데이터베이스 호스트
- `MYSQLPORT` - 데이터베이스 포트 (기본값: 3306)
- `MYSQLUSER` - 데이터베이스 사용자
- `MYSQLPASSWORD` - 데이터베이스 비밀번호
- `MYSQLDATABASE` - 데이터베이스 이름

> **참고**: Railway는 같은 프로젝트 내의 서비스 간에 자동으로 환경 변수를 공유합니다. MySQL 서비스를 추가하면 `MYSQL_*` 접두사가 붙은 환경 변수가 자동으로 생성됩니다.

---

## 2단계: Railway Node.js 백엔드 배포

### 2.1 Railway에 백엔드 프로젝트 연결

1. Railway 프로젝트에서 "New" → "GitHub Repo" 선택
2. GitHub 저장소 선택
3. "Root Directory"를 `backend`로 설정하거나, 루트에서 서브디렉토리로 설정

### 2.2 환경 변수 설정

Railway 백엔드 서비스의 "Variables" 탭에서 다음 환경 변수를 설정하세요:

#### 필수 환경 변수

```
NODE_ENV=production
PORT=4000
```

#### 데이터베이스 연결 (MySQL 서비스와 같은 프로젝트에 있으면 자동 설정됨)

Railway가 자동으로 제공하는 변수를 사용하거나 수동으로 설정:

```
DB_HOST=${MYSQLHOST}
DB_PORT=${MYSQLPORT}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
```

또는 MySQL 서비스의 Variables에서 직접 값을 복사하여 설정:

```
DB_HOST=<MYSQLHOST 값>
DB_PORT=<MYSQLPORT 값>
DB_USER=<MYSQLUSER 값>
DB_PASSWORD=<MYSQLPASSWORD 값>
DB_NAME=<MYSQLDATABASE 값>
```

#### JWT 설정

```
JWT_SECRET=<강력한 랜덤 문자열 생성>
JWT_EXPIRES_IN=7d
```

> **JWT_SECRET 생성 방법**:
>
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

#### CORS 설정 (프론트엔드 도메인)

```
ALLOWED_ORIGINS=https://your-frontend.cloudtype.app
```

여러 도메인을 허용하려면 쉼표로 구분:

```
ALLOWED_ORIGINS=https://your-frontend.cloudtype.app,https://another-domain.com
```

> **참고**: Cloudtype 도메인은 기본적으로 허용되지만, 명시적으로 설정하는 것을 권장합니다.

### 2.3 배포 및 빌드 확인

1. Railway가 자동으로 빌드를 시작합니다
2. "Deployments" 탭에서 빌드 로그 확인
3. 빌드가 성공하면 서비스가 자동으로 시작됩니다
4. "Settings" → "Domains"에서 배포된 URL 확인 (예: `https://your-backend.railway.app`)

### 2.4 데이터베이스 마이그레이션 실행

배포 후 데이터베이스 스키마를 생성해야 합니다:

#### 방법 1: Railway CLI 사용

```bash
# Railway CLI 설치 (없는 경우)
npm i -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 선택
railway link

# 마이그레이션 실행
railway run npm run db:migrate
```

#### 방법 2: Railway 대시보드 사용

1. 백엔드 서비스의 "Deployments" 탭으로 이동
2. "Run Command" 클릭
3. 명령어 입력: `npm run db:migrate`
4. 실행

### 2.5 데이터베이스 시드 (선택사항)

초기 데이터가 필요하면:

```bash
railway run npm run db:seed
```

또는 Railway 대시보드에서 "Run Command"로 실행

### 2.6 헬스 체크

배포가 완료되면 다음 URL로 헬스 체크:

```
https://your-backend.railway.app/health
```

정상 응답 예시:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

---

## 3단계: Cloudtype React 프론트엔드 배포

### 3.1 Cloudtype 프로젝트 생성

1. [Cloudtype 대시보드](https://cloudtype.io)에 로그인
2. "새 프로젝트" 클릭
3. GitHub 저장소 연결
4. 저장소 선택 후 "연결" 클릭

### 3.2 빌드 설정

프로젝트 설정에서 다음을 구성:

- **프로젝트 이름**: 원하는 이름 설정
- **루트 디렉토리**: `frontend` 선택
- **빌드 명령어**: `npm run build`
- **출력 디렉토리**: `dist`
- **Node.js 버전**: 18 이상 (자동 감지됨)

### 3.3 환경 변수 설정

Cloudtype 대시보드의 "환경 변수" 섹션에서 설정:

```
VITE_API_BASE_URL=https://your-backend.railway.app
```

> **중요**: `your-backend.railway.app`을 실제 Railway 백엔드 URL로 변경하세요.

### 3.4 배포

1. 설정 저장 후 자동으로 빌드가 시작됩니다
2. "빌드 로그"에서 빌드 진행 상황 확인
3. 빌드가 성공하면 자동으로 배포됩니다
4. 배포된 URL 확인 (예: `https://your-project.cloudtype.app`)

### 3.5 배포 확인

1. 배포된 URL로 접속하여 프론트엔드가 정상 작동하는지 확인
2. 브라우저 개발자 도구의 Network 탭에서 API 요청이 정상적으로 전송되는지 확인

---

## 4단계: 최종 설정 및 확인

### 4.1 백엔드 CORS 설정 확인

프론트엔드 배포 후, Railway 백엔드의 환경 변수에 Cloudtype 도메인을 추가했는지 확인:

```
ALLOWED_ORIGINS=https://your-project.cloudtype.app
```

환경 변수를 변경한 경우 Railway가 자동으로 재배포합니다.

### 4.2 전체 시스템 테스트

1. **프론트엔드 접속**: Cloudtype 배포 URL로 접속
2. **회원가입/로그인**: 인증 기능 테스트
3. **API 통신**: 프론트엔드에서 백엔드 API 호출 확인
4. **데이터베이스**: 데이터 저장 및 조회 기능 확인

### 4.3 문제 해결

#### 백엔드 연결 실패

- Railway 백엔드 URL이 올바른지 확인
- `VITE_API_BASE_URL` 환경 변수가 올바르게 설정되었는지 확인
- 브라우저 콘솔에서 CORS 오류 확인

#### CORS 오류

- Railway 백엔드의 `ALLOWED_ORIGINS` 환경 변수에 Cloudtype 도메인이 포함되어 있는지 확인
- 도메인은 정확히 일치해야 합니다 (프로토콜 포함)

#### 데이터베이스 연결 실패

- Railway MySQL 서비스가 실행 중인지 확인
- 백엔드의 데이터베이스 환경 변수가 올바른지 확인
- 마이그레이션이 실행되었는지 확인

---

## 환경 변수 요약

### Railway 백엔드

```env
NODE_ENV=production
PORT=4000
DB_HOST=<MySQL 호스트>
DB_PORT=<MySQL 포트>
DB_USER=<MySQL 사용자>
DB_PASSWORD=<MySQL 비밀번호>
DB_NAME=<MySQL 데이터베이스명>
JWT_SECRET=<강력한 랜덤 문자열>
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://your-frontend.cloudtype.app
```

### Cloudtype 프론트엔드

```env
VITE_API_BASE_URL=https://your-backend.railway.app
```

---

## 배포 순서 요약

1. ✅ Railway에 MySQL 서비스 추가
2. ✅ Railway에 백엔드 서비스 추가 및 환경 변수 설정
3. ✅ Railway 백엔드 배포 및 마이그레이션 실행
4. ✅ Cloudtype에 프론트엔드 프로젝트 추가 및 환경 변수 설정
5. ✅ Cloudtype 프론트엔드 배포
6. ✅ 전체 시스템 테스트

---

## 추가 리소스

- [Railway 문서](https://docs.railway.app)
- [Cloudtype 문서](https://docs.cloudtype.io)
- [MySQL 문서](https://dev.mysql.com/doc/)

---

## 문제 발생 시

배포 중 문제가 발생하면:

1. 각 플랫폼의 빌드 로그 확인
2. 환경 변수 설정 재확인
3. 데이터베이스 연결 상태 확인
4. CORS 설정 확인

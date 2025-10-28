# Simplab 백엔드 서버

## 설치 및 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_NAME=simplab
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# 서버 설정
PORT=4000
NODE_ENV=development
```

### 3. MySQL 데이터베이스 설정

MySQL 서버가 실행 중인지 확인하고, 데이터베이스를 생성하세요:

```bash
# MySQL 접속 (비밀번호 입력 필요)
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE simplab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 데이터베이스 마이그레이션

```bash
npm run db:migrate
```

### 5. 시드 데이터 삽입 (선택사항)

```bash
npm run db:seed
```

### 6. 서버 실행

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## API 엔드포인트

### 인증

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 내 정보 조회

### 공모전

- `GET /api/contests` - 공모전 목록
- `GET /api/contests/:id` - 공모전 상세
- `POST /api/contests` - 공모전 생성 (관리자)
- `PUT /api/contests/:id` - 공모전 수정 (관리자)
- `DELETE /api/contests/:id` - 공모전 삭제 (관리자)

### 팀

- `GET /api/teams` - 팀 목록
- `GET /api/teams/:id` - 팀 상세
- `POST /api/teams` - 팀 생성
- `PUT /api/teams/:id` - 팀 수정
- `DELETE /api/teams/:id` - 팀 삭제
- `POST /api/teams/:id/join` - 팀 가입 신청
- `PUT /api/teams/:id/members/:memberId` - 팀 가입 승인/거절

### 관심사

- `GET /api/favorites` - 관심사 목록
- `POST /api/favorites` - 관심사 추가
- `DELETE /api/favorites/:id` - 관심사 제거

### 메시지

- `GET /api/messages/direct` - 직접 메시지 목록
- `GET /api/messages/direct/:userId` - 특정 사용자와의 메시지
- `POST /api/messages/direct` - 직접 메시지 전송
- `GET /api/messages/team/:teamId` - 팀 메시지 목록
- `POST /api/messages/team/:teamId` - 팀 메시지 전송

## 데이터베이스 스키마

### 주요 테이블

- `users` - 사용자 정보
- `contests` - 공모전/대회 정보
- `teams` - 팀 정보
- `team_members` - 팀 멤버 관계
- `favorites` - 관심사 (공모전/팀)
- `messages` - 메시지 (직접/팀)

## 보안 기능

- JWT 토큰 기반 인증
- bcrypt 비밀번호 해시화
- Rate limiting
- CORS 설정
- Helmet 보안 헤더
- 입력 검증

## 개발 도구

- TypeScript
- Express.js
- MySQL2
- JWT
- Bcrypt
- CORS
- Helmet

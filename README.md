Drone Fleet Management - Backend
NestJS, TypeORM ve PostgreSQL ile geliştirilmiş Drone Filo Yönetim API'si.

📋 Özellikler
Drone Yönetimi: CRUD işlemleri, durum yönetimi

Görev Yönetimi: CRUD işlemleri, status akışı, çakışma kontrolü

Bakım Yönetimi: CRUD işlemleri, otomatik bakım tarihi hesaplama

Filo Sağlık Dashboard: Drone istatistikleri, bakım uyarıları

Mission Status Flow: PLANNED → PRE_FLIGHT_CHECK → IN_PROGRESS → COMPLETED/ABORTED

Otomatik Bakım Hesaplama: Her 50 uçuş saatinde veya 90 günde bir

Çakışma Kontrolü: Aynı drone'a çakışan görev atanamaz

Veritabanı Migration: Production-ready migration desteği

Seed: Gerçekçi test verileri (1000 drone, 250 mission, 500 bakım kaydı)

Validation: DTO seviyesinde validasyon

CORS: Frontend entegrasyonu için CORS desteği

🚀 Başlangıç
Gereksinimler
Node.js (v18 veya üzeri)

PostgreSQL (v14 veya üzeri)

npm veya yarn

Kurulum
bash
# 1. Projeyi klonlayın
git clone <repository-url>
cd drone-fleet-backend

# 2. Bağımlılıkları yükleyin
npm install

# 3. Çevresel değişkenleri ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# 4. Veritabanını oluşturun (PostgreSQL'de)
psql -U postgres -c "CREATE DATABASE drone_fleet;"

# 5. Migration'ları çalıştırın
npm run build
npm run migration:run

.env Dosyası
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=drone_fleet

# Server
PORT=3000
NODE_ENV=development

# JWT (opsiyonel)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

Geliştirme Sunucusu
bash
# Geliştirme modu (watch ile)
npm run start:dev

# Debug modu
npm run start:debug

# Production modu
npm run start:prod

backend/
├── src/
│   ├── drones/              # Drone modülü
│   │   ├── drones.controller.ts
│   │   ├── drones.service.ts
│   │   └── drones.module.ts
│   ├── missions/            # Mission modülü
│   │   ├── missions.controller.ts
│   │   ├── missions.service.ts
│   │   └── missions.module.ts
│   ├── maintenance/         # Maintenance modülü
│   │   ├── maintenance.controller.ts
│   │   ├── maintenance.service.ts
│   │   └── maintenance.module.ts
│   ├── seed/                # Seed modülü
│   │   ├── seed.controller.ts
│   │   ├── seed.service.ts
│   │   └── seed.module.ts
│   ├── entities/            # TypeORM entity'leri
│   │   ├── drone.entity.ts
│   │   ├── mission.entity.ts
│   │   └── maintenance-log.entity.ts
│   ├── dto/                 # Data Transfer Object'ler
│   │   ├── create-drone.dto.ts
│   │   ├── create-mission.dto.ts
│   │   └── create-maintenance-log.dto.ts
│   ├── migrations/          # Database migration dosyaları
│   │   └── *.ts
│   ├── app.module.ts        # Ana modül
│   ├── app.controller.ts    # Ana controller
│   ├── app.service.ts       # Ana servis
│   └── main.ts              # Uygulama giriş noktası
├── typeorm.config.ts        # TypeORM konfigürasyonu
├── .env.example             # Örnek çevresel değişkenler
├── package.json             # Proje bağımlılıkları
├── tsconfig.json            # TypeScript konfigürasyonu
└── nest-cli.json            # NestJS CLI konfigürasyonu

🛠 Kullanılan Teknolojiler
NestJS	10.x	Backend framework
TypeORM	0.3.x	ORM
PostgreSQL	14+	Veritabanı
TypeScript	5.x	Tip güvenliği
Class-Validator	0.14.x	Validasyon
Class-Transformer	0.5.x	DTO dönüşümü
Dotenv	16.x	Çevresel değişkenler
UUID	9.x	UUID oluşturma

🔧 Script'ler
Script	Açıklama
npm run start	Production modunda başlat
npm run start:dev	Geliştirme modunda başlat (watch ile)
npm run start:debug	Debug modunda başlat
npm run build	Production build oluştur
npm run migration:run	Migration'ları çalıştır
npm run migration:revert	Son migration'ı geri al
npm run migration:create	Yeni migration oluştur
npm run migration:generate	Otomatik migration oluştur
npm run seed	Seed verilerini yükle
npm run clear-data	Tüm verileri temizle

🎯 API Endpoint'leri
Drone Endpoint'leri
Method	Endpoint	Açıklama
GET	/api/drones	Tüm droneları listele (pagination, filtreleme)
GET	/api/drones/:id	Drone detayı
POST	/api/drones	Yeni drone oluştur
PUT	/api/drones/:id	Drone güncelle
DELETE	/api/drones/:id	Drone sil
GET	/api/drones/:id/can-delete	Drone silinebilir mi kontrol et
POST	/api/drones/:id/maintenance	Bakım durumunu güncelle
Mission Endpoint'leri
Method	Endpoint	Açıklama
GET	/api/missions	Tüm görevleri listele (pagination, filtreleme)
GET	/api/missions/:id	Görev detayı
POST	/api/missions	Yeni görev oluştur
PUT	/api/missions/:id	Görev güncelle
DELETE	/api/missions/:id	Görev sil
Filtre Parametreleri:

status: PLANNED, PRE_FLIGHT_CHECK, IN_PROGRESS, COMPLETED, ABORTED

droneId: Belirli bir drone'un görevleri

startDate: Başlangıç tarihi (ISO format)

endDate: Bitiş tarihi (ISO format)

Maintenance Endpoint'leri
Method	Endpoint	Açıklama
GET	/api/maintenance	Tüm bakım kayıtlarını listele
GET	/api/maintenance/:id	Bakım kaydı detayı
POST	/api/maintenance	Yeni bakım kaydı oluştur
PUT	/api/maintenance/:id	Bakım kaydı güncelle
DELETE	/api/maintenance/:id	Bakım kaydı sil
POST	/api/maintenance/:droneId/start	Drone'u bakıma al
POST	/api/maintenance/:droneId/complete	Bakımı tamamla
Dashboard Endpoint'leri
Method	Endpoint	Açıklama
GET	/health	Filo sağlık durumu özeti
GET	/api/dashboard/health	Filo sağlık durumu özeti (alternatif)
Seed Endpoint'leri
Method	Endpoint	Açıklama
POST	/api/seed	Test verilerini yükle
DELETE	/api/seed	Tüm verileri temizle
GET	/api/seed/status	Seed servis durumu


📊 Mission Status Flow
text
PLANNED → PRE_FLIGHT_CHECK → IN_PROGRESS → COMPLETED
    ↓              ↓                ↓
  ABORTED       ABORTED          ABORTED
PLANNED: Görev planlandı

PRE_FLIGHT_CHECK: Uçuş öncesi kontrol

IN_PROGRESS: Görev devam ediyor

COMPLETED: Görev tamamlandı (final)

ABORTED: Görev durduruldu (final)

🔒 Validasyon Kuralları
Drone Validasyonları
serialNumber: SKY-XXXX-XXXX formatında olmalı

totalFlightHours: 0'dan küçük olamaz

status: AVAILABLE, IN_MISSION, MAINTENANCE, RETIRED

Mission Validasyonları
plannedStart: Geçmişe planlanamaz

plannedStart: plannedEnd'den önce olmalı

Aynı drone'a çakışan görev atanamaz

Sadece AVAILABLE dronelar göreve atanabilir

flightHoursLogged: COMPLETED durumunda zorunlu

abortReason: ABORTED durumunda zorunlu

Maintenance Validasyonları
flightHoursAtTime: 0'dan küçük olamaz

datePerformed: Geçerli bir tarih olmalı

Sadece AVAILABLE veya MAINTENANCE dronelar bakıma alınabilir

🗄️ Veritabanı Migration
bash
# Yeni migration oluştur
npm run migration:create src/migrations/MyMigration

# Migration'ları çalıştır
npm run migration:run

# Migration'ı geri al
npm run migration:revert

# Otomatik migration oluştur (entity değişikliklerine göre)
npm run migration:generate src/migrations/AutoMigration


Migration Dosyası Örneği
typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MyMigrationXXXXXXXXX implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "new_table" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        CONSTRAINT "PK_new_table" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "new_table"`);
  }
}

Seed ile oluşturulan veriler:

1000 drone (gerçekçi durum dağılımı ile)

250 mission (tarih ve durum dağılımı ile)

500 maintenance log (drone'lara bağlı olarak)

Fleet Health
curl http://localhost:3000/health
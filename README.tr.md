<div align="center">
  <img src="https://assets.umod.org/images/rust-logo.png" alt="Rust Server Panel" width="120" />
  <h1>RustServerPanel</h1>
  <p><strong>Rust Oyun Sunucuları İçin En Gelişmiş Açık Kaynaklı Web Paneli</strong></p>
  
  <p>
    <a href="README.md">🇺🇸 English</a> •
    <a href="README.tr.md">🇹🇷 Türkçe</a> •
    <a href="README.zh.md">🇨🇳 中文</a> •
    <a href="README.es.md">🇪🇸 Español</a> •
    <a href="README.ru.md">🇷🇺 Русский</a> •
    <a href="README.de.md">🇩🇪 Deutsch</a>
  </p>

  
  <p>
    <a href="https://github.com/k0d1r/rustserverpanel/issues"><img src="https://img.shields.io/github/issues/k0d1r/rustserverpanel?style=flat-square" alt="Issues" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/network/members"><img src="https://img.shields.io/github/forks/k0d1r/rustserverpanel?style=flat-square" alt="Forks" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/stargazers"><img src="https://img.shields.io/github/stars/k0d1r/rustserverpanel?style=flat-square" alt="Stars" /></a>
    <a href="https://github.com/k0d1r/rustserverpanel/blob/main/LICENSE"><img src="https://img.shields.io/github/license/k0d1r/rustserverpanel?style=flat-square" alt="License" /></a>
  </p>

</div>

## 📖 Genel Bakış

**RustServerPanel**, özel olarak **Rust** sunucuları için geliştirilmiş, modern, yüksek performanslı ve tamamen açık kaynak kodlu bir sunucu yönetim panelidir. Hantal ve ücretli ticari panellerin yerini alması için tasarlanan bu proje, **WebRCON** üzerinden bağlanarak sunucunuz, eklentileriniz ve oyuncularınız üzerinde gecikmesiz, eşzamanlı kontrol sağlar.

Büyüleyici "Glassmorphism" (Cam efektli) Zinc Karanlık Teması ile oluşturulmuş bu panel, ister tek bir vanilla sunucu ister devasa modlu bir sunucu ağı yönetin, size benzersiz bir yönetici deneyimi sunar.

## ✨ Öne Çıkan Özellikler

- 🚀 **Canlı WebRCON Konsol**: Renklendirilmiş (syntax highlighting), otomatik kaydırmalı ve filtrelemeli entegre terminal ile sıfır gecikmeli komut deneyimi.
- 👥 **Gelişmiş Oyuncu Yönetimi**: Canlı oyuncu takibi, tek tıkla kick/ban atma, Steam profil bağlantıları.
- 🧩 **Tek Tıkla Eklenti Yöneticisi**: uMod/Oxide ile doğrudan entegrasyon. Doğrudan web paneli üzerinden eklentilere (plugin) göz atın, indirin, güncelleyin ve silin.
- ⚙️ **Değişkenler (Convar) ve Dosya Editörü**: Yerleşik Monaco editörü ile sunucu ayarlarını (convar) ve JSON yapılandırma dosyalarını güvenle düzenleyin.
- 💾 **Otomatik Görevler (Wipe & Backup)**: Güçlü Cron sistemi sayesinde Harita Wipe, Blueprint Wipe, Full Wipe ve ZIP Sunucu Yedeklemelerini otomatikleştirin.
- 🌐 **Global Çoklu Dil (i18n)**: Türkçe, İngilizce, Çince, İspanyolca, Rusça ve Almanca dahil 6 dili anında destekler.

## 🛠️ Kullanılan Teknolojiler

- **Frontend (Önyüz)**: React 18, Vite, Tailwind CSS, TypeScript, TanStack Query, Recharts, Zustand.
- **Backend (Arkayüz)**: Node.js, Express, WebSocket (ws), SQLite3, node-cron.
- **Güvenlik**: JWT Kimlik Doğrulama, bcrypt şifreleme, Express Rate Limiting.

## 📦 Kurulum Rehberi

### Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya daha yeni)
- WebRCON aktif edilmiş çalışan bir Rust Oyun Sunucusu (`+rcon.web 1`)

### 1. Projeyi İndirin (Clone)
```bash
git clone https://github.com/k0d1r/rustserverpanel.git
cd rustserverpanel
```

### 2. Backend'i Başlatın
```bash
cd backend
npm install
# Örnek çevre değişkenleri (env) dosyasını kopyalayın
cp .env.example .env
# Üretim (Production) derlemesini oluşturun ve başlatın
npm run build
npm start
```
*Not: Varsayılan giriş bilgileri - Kullanıcı adı: `admin`, Şifre: `admin123`*

### 3. Frontend'i Başlatın
```bash
cd ../frontend
npm install
npm run build
npm run preview
```

## 📸 Ekran Görüntüleri


![Screenshot 1](./assets/screenshots/screenshot1.png)

![Screenshot 2](./assets/screenshots/screenshot2.png)

![Screenshot 3](./assets/screenshots/screenshot3.png)

![Screenshot 4](./assets/screenshots/screenshot4.png)

![Screenshot 5](./assets/screenshots/screenshot5.png)

![Screenshot 6](./assets/screenshots/screenshot6.png)

![Screenshot 7](./assets/screenshots/screenshot7.png)

![Screenshot 8](./assets/screenshots/screenshot8.png)

![Screenshot 9](./assets/screenshots/screenshot9.png)

![Screenshot 10](./assets/screenshots/screenshot10.png)


## 🤝 Katkıda Bulunma
Projeye katkılarınızı her zaman bekliyoruz! Geliştirme veya önerileriniz için bir PR (Pull Request) veya Issue açmaktan çekinmeyin.

## 📄 Lisans
Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakabilirsiniz.

---
**SEO Anahtar Kelimeleri**: Rust Sunucu Paneli, Rust RCON, WebRCON, Oxide Admin, uMod Yöneticisi, Rust Server Kurma, Açık Kaynak Rust Paneli, Rust Yönetim Paneli.

<div align="center">
  <i><a href="https://github.com/k0d1r">k0d1r</a> tarafından ❤️ ile geliştirildi</i>
</div>
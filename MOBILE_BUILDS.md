# Mobile Builds (Etap 5)

Инструкция по сборке мобильного приложения PM-Task через EAS.

## Подготовка (один раз)

### 1. Регистрация в Expo

1. Зайти на [expo.dev](https://expo.dev), создать аккаунт (бесплатно).
2. Подтвердить email.

### 2. Установить EAS CLI на маке

```bash
npm install -g eas-cli
eas --version          # должно быть >= 14.x
eas login              # вводишь email/password от expo.dev
eas whoami             # проверка
```

### 3. Сгенерить иконки

```bash
bash scripts/generate-icons.sh
```

Скрипт:
- Поставит `sharp` если её нет (одноразово)
- Сконвертит SVG-исходники из `front/assets/*.svg` в `*.png`

### 4. Привязать проект к EAS

```bash
cd front
eas init
# Подтвердить создание нового проекта
# EAS пропишет extra.eas.projectId в app.json
```

После этого в `app.json` появится секция `extra.eas.projectId` — это unique ID проекта в твоём Expo-аккаунте.

---

## Android `.apk` через preview-профиль

```bash
cd front
eas build --profile preview --platform android
```

EAS спросит:
- **Generate a new Android Keystore?** — `Yes`. EAS хранит ключ у себя в шифрованном виде.

Билд занимает ~15–25 минут (запускается на серверах Expo). По окончании — ссылка на `.apk` приходит на email + видна в личном кабинете на expo.dev.

### Установка на телефон

**Вариант 1:** на телефоне открыть в браузере прямую ссылку из expo.dev → нажать **Install** → разрешить установку из неизвестных источников.

**Вариант 2:** скачать `.apk` на компьютер, передать в Telegram → открыть на телефоне.

После установки приложение появится с иконкой `PM` (индиго).

---

## iOS — TestFlight через preview/production-профиль

### Что нужно заранее

1. **Apple Developer Program ($99/год)** — оплачен.
2. **Apple ID** с включённым 2FA.
3. **Bundle ID** `ru.spbu.pmi.pmtask` зарегистрирован в [developer.apple.com → Identifiers](https://developer.apple.com/account/resources/identifiers/list).

### Привязка credentials

```bash
cd front
eas credentials
# Выбираешь iOS → Login with Apple → 2FA-код
# EAS сам сгенерит Distribution Certificate + Provisioning Profile,
# зальёт их в твой Apple Developer аккаунт.
```

### Сборка

```bash
eas build --profile preview --platform ios     # ad-hoc для тестирования
eas build --profile production --platform ios  # для App Store / TestFlight
```

~25 минут, по окончании — ссылка на `.ipa`.

### Заливка в TestFlight

1. В **App Store Connect** ([appstoreconnect.apple.com](https://appstoreconnect.apple.com)) → **My Apps** → **+** → создать app record:
   - Bundle ID: `ru.spbu.pmi.pmtask`
   - SKU: `pmtask-001`
   - Primary Language: Russian

2. Залить `.ipa`:

   ```bash
   eas submit --platform ios --profile production --latest
   ```

3. В App Store Connect → твоё app → **TestFlight** → ждёшь пока обработается (~5–15 минут) → добавляешь testers по email.

4. На iPhone установить `TestFlight` из App Store, войти под Apple ID, увидеть приглашение → установить приложение.

### App Store (публичная публикация)

После TestFlight-валидации:

1. В App Store Connect → **App Store** → **+ Version or Platform**.
2. Заполнить:
   - **Screenshots** (3 на каждый размер: 6.9", 6.7", 5.5")
   - **Description** (см. `docs/app-store-description.md`)
   - **Keywords**
   - **Support URL**: `https://spbu-pmi.ru/support`
   - **Privacy Policy URL**: `https://spbu-pmi.ru/privacy`
   - **App Privacy** — заполнить декларацию о собираемых данных
3. **Submit for Review** → Apple проверяет 1-3 дня.
4. После approval — нажать **Release**, приложение появляется в App Store.

---

## Обновление приложения после релиза

Один раз поднял version в `app.json`:

```json
"version": "1.0.1",
"ios": { "buildNumber": "2" },
"android": { "versionCode": 2 }
```

И:

```bash
eas build --profile production --platform all
eas submit --profile production --platform all
```

---

## Полезные команды

```bash
# Список билдов
eas build:list

# Прямые ссылки на скачивание
eas build:view <build-id>

# Просмотр текущих credentials
eas credentials

# Отмена запущенного билда
eas build:cancel <build-id>
```

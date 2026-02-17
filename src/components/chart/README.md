# Direktori Chart Components

Direktori ini berisi semua logika yang berkaitan dengan implementasi SciChart.

## Struktur Direktori

### `core/` (Inti Grafik)

- **`ChartBuilder.ts`**: **"Otak"** dari grafik.
  1.  Inisialisasi `SciChartSurface` (kanvas grafik).
  2.  Memanggil konfigurasi sumbu, modifier, dan series.
  3.  Menggabungkan logika data dan kontrol (`ChartData`, `ChartControls`) menjadi satu objek return value.

- **`ChartInitializer.ts`**: **"Jembatan"** antara React UI (`App.tsx`) dan logika SciChart.
  1.  Memanggil `ChartBuilder`.
  2.  Mengambil data historis dari provider terpilih.
  3.  Mengisi data ke grafik & melakukan subscribe ke WebSocket provider.

### `config/` (Konfigurasi)

- **`Axes.ts`**: Mengatur tampilan sumbu X (Waktu) dan Y (Harga).
- **`Modifiers.ts`**: Mengatur interaksi pengguna (Zoom, Pan, Selection).
- **`Series.ts`**: Mengatur tampilan candle stick & indikator.

### `features/` (Fitur Tambahan)

- **`Palette.ts`**: Pewarnaan candle dan volume.
- **`PriceAnnotation.ts`**: Garis harga terakhir.
- **`SelectionModifier.ts`**: Logika pemilihan area chart.

### `tools/` (Alat Gambar)

Berisi logika alat gambar seperti Garis dan Kotak.

### `utils/` (Helper)

Fungsi pembantu statistik dan manipulasi data.

### `templates/`

Template HTML/SVG untuk tooltip custom.

## Cara Maintenance

- **Ubah Tampilan Grafik (Warna Candle, dll)**: Edit `config/Series.ts`.
- **Ubah Format Angka/Tanggal Sumbu**: Edit `config/Axes.ts`.
- **Ubah Perilaku Zoom/Geser**: Edit `config/Modifiers.ts`.

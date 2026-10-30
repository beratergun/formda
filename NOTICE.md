# Üçüncü taraf kaynakları

Uygulama kodu MIT lisanslıdır. Yerel paketlenen Onest ve Bricolage Grotesque fontları SIL Open Font License 1.1 kapsamındadır; özgün bildirimleri `public/licenses/` içinde dağıtılır. Fontlar değiştirilmemiştir.

Besin kayıtlarının her biri kaynak etiketi taşır. USDA SR Legacy değerleri için [besin kaynakları](docs/food-sources.md) belgesine bak. Kullanıcının açık sorgusuyla gelen Open Food Facts ürünü yerel kayda kaynak bilgisiyle eklenir; bu ürünler başlangıç veri setinin parçası değildir.

Lucide ikonları ve npm bağımlılıkları kendi lisanslarını korur. Bağımlılık sürümleri `package-lock.json` içinde sabittir; paketlerin özgün lisans bildirimleri npm dağıtımlarıyla gelir. Uygulama fotoğrafları veya dışarıdan alınmış egzersiz videoları dağıtılmaz. Tanıtım ekranlarındaki silüetler ve günlük kayıtları bu proje için çizilmiş/üretilmiş kurgusal demo içerikleridir.

- @capgo/capacitor-health 8.11.13: MPL-2.0, https://github.com/Cap-go/capacitor-health . Paket kaynakları değiştirilmez. Uygulama yalnızca beş sağlık kategorisine okuma izni ister; tüm yazma ve gereksiz okuma izinleri Android manifest birleşiminde kaldırılır.

- Transformers.js 4.3.2 ve isteğe bağlı `onnx-community/swin-finetuned-food101-ONNX` modeli Apache-2.0 lisanslıdır. Model revizyonu `e5e50bfc6425aa546f3b4421ca8bd79d0dd610b8` ile sabittir. [Model kartı ve lisansı](https://huggingface.co/onnx-community/swin-finetuned-food101-ONNX) kullanıcı açıkça açtıktan sonra indirilen ağırlıkların kaynağıdır. ONNX Runtime MIT lisanslıdır. Paket ve model kaynakları değiştirilmez.

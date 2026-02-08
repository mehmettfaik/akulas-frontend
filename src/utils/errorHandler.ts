/**
 * Backend API hatalarından kullanıcıya gösterilecek Türkçe mesajı çıkarır.
 * Axios error.response.data.message > error.response.data.error > error.message sırasıyla bakar.
 */
export function getErrorMessage(error: any, fallback = 'Bir hata oluştu!'): string {
  // Backend'den gelen yapılandırılmış hata mesajı
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Backend'den gelen alternatif hata alanı
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  // Ağ hatası veya genel JS hatası
  if (error?.message) {
    // Axios'un genel "Request failed with status code XXX" mesajını Türkçeye çevir
    if (error.message.includes('Network Error')) {
      return 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.';
    }
    if (error.message.includes('timeout')) {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }
    if (error.message.includes('Request failed with status code 500')) {
      return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
    }
    if (error.message.includes('Request failed with status code 404')) {
      return 'İstenen kaynak bulunamadı.';
    }
    if (error.message.includes('Request failed with status code')) {
      return error.message;
    }
    return error.message;
  }

  return fallback;
}

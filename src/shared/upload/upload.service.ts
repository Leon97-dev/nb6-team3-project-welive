class UploadService {
  // 1) 이미지 URL 생성
  async getImageUrl(
    file: Express.Multer.File | undefined,
    baseUrl = ''
  ): Promise<string | null> {
    // 1-1) 파일이 없는 경우 null 반환
    if (!file) return null;

    // 1-2) baseUrl이 http로 시작하지 않으면 http://를 붙여서 정규화
    const normalizedBase =
      baseUrl && !baseUrl.startsWith('http') ? `http://${baseUrl}` : baseUrl;

    // 1-3) baseUrl과 파일 경로를 조합하여 이미지 URL 생성
    const prefix = normalizedBase ? normalizedBase.replace(/\/$/, '') : '';

    // 1-4) 최종 이미지 URL 반환
    return `${prefix}/upload/${file.filename}`;
  }
}

export default new UploadService();

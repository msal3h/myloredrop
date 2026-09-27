export function nicknameKey(userId: string) {
  return `loredrop-nickname:${userId}`
}

export function getNickname(userId: string) {
  return localStorage.getItem(nicknameKey(userId)) ?? localStorage.getItem('loredrop-nickname') ?? ''
}

export function saveNickname(userId: string, nickname: string) {
  localStorage.setItem(nicknameKey(userId), nickname)
  localStorage.removeItem('loredrop-nickname')
}

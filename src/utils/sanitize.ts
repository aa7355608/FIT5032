import DOMPurify from 'dompurify'
export const safeHTML = (html: string) => DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['b','i','em','strong','a','ul','ol','li','p']
})

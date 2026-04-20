import Taro from '@tarojs/taro'
import type { ParsedFund } from '@fund-manager/shared'

/**
 * Choose image from camera or album
 */
export async function chooseImage(): Promise<string> {
  const res = await Taro.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
  })
  return res.tempFilePaths[0]
}

/**
 * Use WeChat's built-in OCR or Tencent Cloud OCR
 * For v1: send image to our Express server which proxies to Tencent Cloud OCR
 */
export async function recognizeImage(imagePath: string): Promise<string[]> {
  const uploadRes = await Taro.uploadFile({
    url: 'http://localhost:3001/api/ocr/recognize',
    filePath: imagePath,
    name: 'image',
  })

  if (uploadRes.statusCode !== 200) {
    throw new Error('OCR识别失败')
  }

  const data = JSON.parse(uploadRes.data)
  return data.lines as string[]
}

/**
 * Parse OCR text lines to extract fund information
 * Handles common patterns from 支付宝 and 理财通 screenshots
 */
export function parseOCRText(lines: string[]): ParsedFund[] {
  const funds: ParsedFund[] = []
  const fullText = lines.join('\n')

  // Pattern: 6-digit fund code
  const codePattern = /(\d{6})/g
  const foundCodes = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = codePattern.exec(fullText)) !== null) {
    const code = match[1]
    // Filter out unlikely fund codes (timestamps, amounts, etc.)
    if (!code.startsWith('9') && !foundCodes.has(code)) {
      foundCodes.add(code)
    }
  }

  for (const code of foundCodes) {
    // Try to find fund name near the code
    const namePattern = new RegExp(
      `(?:([\\u4e00-\\u9fa5A-Za-z][\\u4e00-\\u9fa5A-Za-z0-9·\\-]+)\\s*${code}|${code}\\s*([\\u4e00-\\u9fa5A-Za-z][\\u4e00-\\u9fa5A-Za-z0-9·\\-]+))`
    )
    const nameMatch = namePattern.exec(fullText)
    const fundName = nameMatch ? (nameMatch[1] || nameMatch[2] || '') : ''

    // Try to find shares (份额) near the code
    const sharesPattern = new RegExp(
      `${code}[\\s\\S]{0,100}?(?:份额|持有份额)[：:]*\\s*([\\d,]+\\.?\\d*)`
    )
    const sharesMatch = sharesPattern.exec(fullText)
    const shares = sharesMatch ? parseFloat(sharesMatch[1].replace(/,/g, '')) : undefined

    // Try to find cost nav near the code
    const costPattern = new RegExp(
      `${code}[\\s\\S]{0,100}?(?:成本|买入均价)[：:]*\\s*(\\d+\\.\\d+)`
    )
    const costMatch = costPattern.exec(fullText)
    const costNav = costMatch ? parseFloat(costMatch[1]) : undefined

    funds.push({
      fundCode: code,
      fundName: fundName.trim(),
      shares,
      costNav,
      confirmed: false,
    })
  }

  return funds
}

/**
 * Fallback: manual OCR using local regex only (no server)
 * User can paste text from screenshot
 */
export function parseTextInput(text: string): ParsedFund[] {
  return parseOCRText(text.split('\n'))
}

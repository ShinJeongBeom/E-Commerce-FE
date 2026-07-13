import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ANONYMOUS, loadTossPayments } from '@tosspayments/tosspayments-sdk'
import './App.css'

type Category = 'all' | 'plants' | 'pots' | 'tools' | 'sale'
type View = 'home' | 'shop' | 'auth' | 'admin' | 'seller' | 'mypage' | 'settings' | 'payment-result'
type AuthMode = 'login' | 'signup'
type UserRole = 'USER' | 'SELLER' | 'ADMIN'
type AdminSectionId = 'orders' | 'boards' | 'members' | 'products' | 'statistics' | 'policies'

type Product = {
  id: number
  name: string
  category: Exclude<Category, 'all' | 'sale'>
  price: number
  salePrice?: number
  deliveryFee: number
  shortInfo: string
  detail: string
  tags: string[]
  images: string[]
}

type ProductApiResponse = {
  id: number
  name: string
  plantType?: string | null
  careLevel?: string | null
  lightRequirement?: string | null
  wateringCycle?: string | null
  imageUrl?: string | null
  potIncluded?: string | null
  description?: string | null
  price: number
  stock: number
  status?: string | null
}

type CartItem = {
  product: Product
  quantity: number
}

type CartItemApiResponse = {
  cartItemId: number
  productId: number
  productName: string
  price: number
  quantity: number
}

type OrderCheckoutResponse = {
  orderId: string
  orderName: string
  amount: number
}

type PaymentResponse = {
  paymentId: number
  orderId: number
  paymentKey: string
  tossOrderId: string
  orderName: string
  totalAmount: number
  method: string
  status: string
  requestedAt: string
  approvedAt: string | null
  receiptUrl: string | null
}

type OrderHistoryResponse = {
  orderId: number
  orderNumber: string
  totalPrice: number
  status: string
  name: string
  phone: string
  address: string
}

type SignupForm = {
  name: string
  email: string
  loginId: string
  password: string
  passwordConfirm: string
  role: Exclude<UserRole, 'ADMIN'>
  address: string
  addressDetail: string
  phone: string
}

type AdminDashboardResponse = {
  loginId: string
  today: string
  domainExpiresAt: string
  domainDday: number
  quickMenus: AdminQuickMenu[]
  todayStatus: AdminTodayStatus
  pendingStatus: AdminPendingStatus
  marketplaceStatus: AdminMarketplaceStatus
  improvementPosts: AdminBoardPost[]
  manualPosts: AdminBoardPost[]
}

type AdminQuickMenu = {
  label: string
  target: string
}

type AdminTodayStatus = {
  memberSignupCount: number
  memberWithdrawalCount: number
  productCreatedCount: number
  orderCount: number
}

type AdminPendingStatus = {
  productReportCount: number
  exchangeRefundCount: number
  oneToOneInquiryCount: number
  productInquiryCount: number
  sellerApprovalCount: number
  orderProcessingCount: number
}

type AdminMarketplaceStatus = {
  sellerApprovalWaitingCount: number
  todaySellerSignupCount: number
  settlementPendingAmount: number
  reportedProductCount: number
  reportedReviewCount: number
  suspendedProductCount: number
}

type AdminMenu = {
  id: AdminSectionId
  label: string
}

type AdminBoardPost = {
  title: string
  authorLoginId: string
  createdDate: string
}

type AdminOrder = {
  orderId: number
  orderNumber: string
  totalPrice: number
  status: string
  name: string
  phone: string
  address: string
}

type AdminMember = {
  id: number
  loginId: string
  email: string
  phone: string
  role: UserRole
  status: string
  createdAt: string | null
}

type AdminSeller = {
  id: number
  memberId: number
  loginId: string
  email: string
  storeName: string
  approvalStatus: string
}

type AdminProduct = {
  id: number
  name: string
  plantType: string
  price: number
  stock: number
  status: string
}

type AdminPolicy = {
  id: number
  policyKey: string
  title: string
  content: string
}

type AdminPost = {
  id: number
  type: string
  title: string
  content: string
  authorLoginId: string
  createdAt: string | null
}

type AdminInquiry = {
  id: number
  authorLoginId: string
  title: string
  content: string
  answer: string | null
  status: string
}

type AdminReport = {
  id: number
  targetType: 'PRODUCT' | 'REVIEW'
  targetId: number
  reason: string
  status: string
}

type AdminSettlement = {
  id: number
  sellerProfileId: number
  storeName: string
  amount: number
  status: string
}

type AdminPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

type SellerProfileResponse = {
  sellerProfileId: number
  storeName: string
  approvalStatus: string
}

type SellerDashboardResponse = {
  profile: SellerProfileResponse
  waitingPaymentCount: number
  preparingDeliveryCount: number
  cancelledOrderCount: number
  todaySettlementAmount: number
  todaySalesAmount: number
  monthlySalesAmount: number
  orderCount: number
  productCount: number
  notices: string[]
}

type SellerSection = 'register' | 'products' | 'orders' | 'sales' | 'inquiries' | 'settlements'

type SellerProductResponse = {
  id: number
  name: string
  price: number
  stock: number
  status: string
  imageUrl: string
}

type SellerOrderResponse = {
  id: number
  orderNumber: string
  totalPrice: number
  status: string
  receiverName: string
  receiverPhone: string
  shippingAddress: string
}

type SellerSalesResponse = {
  todaySalesAmount: number
  monthlySalesAmount: number
  orderCount: number
  averageOrderAmount: number
}

type SellerInquiryResponse = {
  id: number
  title: string
  status: string
}

type SellerProductForm = {
  name: string
  plantType: string
  careLevel: 'EASY' | 'NORMAL' | 'HARD'
  lightRequirement: 'LOW' | 'MEDIUM' | 'HIGH'
  wateringCycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  imageUrl: string
  potIncluded: string
  description: string
  price: string
  stock: string
  status: 'ON_SALE' | 'SOLD_OUT' | 'HIDDEN'
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY ?? ''
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=900&q=80'

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: '방울복랑금',
    category: 'plants',
    price: 12000,
    salePrice: 9900,
    deliveryFee: 3000,
    shortInfo: '둥근 잎에 은은한 금빛 무늬가 도는 인기 다육식물',
    detail: '햇빛이 잘 드는 창가에서 색감이 살아나며, 흙이 충분히 마른 뒤 물을 주면 건강하게 자랍니다.',
    tags: ['초보 추천', '금빛 무늬', '소형 화분'],
    images: [
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 2,
    name: '에케베리아 라우이',
    category: 'plants',
    price: 18000,
    deliveryFee: 3000,
    shortInfo: '분가루가 고운 로제트형 다육',
    detail: '잎 표면의 백분이 매력적인 품종입니다. 물이 잎에 오래 남지 않게 통풍을 신경 써주세요.',
    tags: ['로제트', '고급 품종', '밝은 햇빛'],
    images: [
      'https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 3,
    name: '하월시아 옵투사',
    category: 'plants',
    price: 15000,
    salePrice: 12900,
    deliveryFee: 3000,
    shortInfo: '투명한 창이 매력적인 실내 다육',
    detail: '직사광선보다 밝은 간접광을 좋아합니다. 실내 책상이나 선반에서 키우기 좋습니다.',
    tags: ['실내 추천', '간접광', '투명창'],
    images: [
      'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 4,
    name: '리톱스 믹스',
    category: 'plants',
    price: 9000,
    deliveryFee: 3000,
    shortInfo: '작고 독특한 돌멩이 모양 다육',
    detail: '과습에 약하므로 물주기 간격을 길게 두는 것이 좋습니다. 독특한 모양으로 수집용 인기가 높습니다.',
    tags: ['희귀한 형태', '수집용', '소량 물주기'],
    images: [
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1493957988430-a5f2e15f39a3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 5,
    name: '세덤 모건뷰티',
    category: 'plants',
    price: 11000,
    deliveryFee: 3000,
    shortInfo: '통통한 잎과 은은한 색감의 데일리 다육',
    detail: '건조에 강하고 번식이 쉬워 처음 다육식물을 키우는 분에게도 잘 맞습니다.',
    tags: ['번식 쉬움', '초보 추천', '통통한 잎'],
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509223197845-458d87318791?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 9001,
    name: '토분 베이직 10cm',
    category: 'pots',
    price: 6500,
    deliveryFee: 3000,
    shortInfo: '통기성이 좋아 다육식물 분갈이에 쓰기 좋은 기본 토분',
    detail: '물마름이 빠른 편이라 과습에 약한 다육식물과 잘 맞습니다. 받침과 함께 사용하면 실내 관리가 쉽습니다.',
    tags: ['화분', '토분', '분갈이', '통기성'],
    images: [
      'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80',
    ],
  },
  {
    id: 9002,
    name: '다육 전용 배양토',
    category: 'tools',
    price: 7900,
    deliveryFee: 3000,
    shortInfo: '마사와 펄라이트가 섞인 배수 중심의 다육 전용 흙',
    detail: '뿌리 과습을 줄이고 통풍을 돕는 배합입니다. 분갈이와 삽목용으로 함께 사용할 수 있습니다.',
    tags: ['보조도구', '배양토', '흙', '분갈이', '배수'],
    images: [
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
    ],
  },
]

const categoryLabels: Record<Category, string> = {
  all: '전체',
  plants: '다육식물',
  pots: '화분',
  tools: '보조도구',
  sale: '세일',
}

const adminMenus: AdminMenu[] = [
  { id: 'orders', label: '주문 관리' },
  { id: 'boards', label: '게시판 관리' },
  { id: 'members', label: '회원 관리' },
  { id: 'products', label: '상품 관리' },
  { id: 'statistics', label: '통계' },
  { id: 'policies', label: '기본 정책 관리' },
]

const defaultAdminPolicies: AdminPolicy[] = [
  {
    id: -1,
    policyKey: 'product-policy',
    title: '상품 운영 정책',
    content: '판매자는 승인 후 상품을 등록할 수 있으며, 관리자는 부적절한 상품을 숨김/복구/삭제 처리할 수 있습니다.',
  },
  {
    id: -2,
    policyKey: 'order-policy',
    title: '주문 처리 정책',
    content: '결제 완료 주문은 판매자 주문 관리 대상이 되며, 배송 준비와 배송 완료 상태를 기준으로 운영합니다.',
  },
  {
    id: -3,
    policyKey: 'seller-policy',
    title: '판매자 승인 정책',
    content: '판매자 가입 계정은 관리자 승인 후 판매자 센터의 상품 등록, 주문 관리, 매출 관리 기능을 사용할 수 있습니다.',
  },
  {
    id: -4,
    policyKey: 'settlement-policy',
    title: '정산 정책',
    content: '정산 대기 금액은 결제 완료 주문을 기준으로 집계하고, 관리자 확인 후 정산 완료 상태로 변경합니다.',
  },
  {
    id: -5,
    policyKey: 'report-policy',
    title: '신고 처리 정책',
    content: '신고된 상품과 리뷰는 관리자 검수 후 처리 완료하거나 상품 판매 상태를 조정합니다.',
  },
]

async function readApiResponseMessage(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const data = await response.json()
    return data.message ?? data.error ?? '요청 처리에 실패했습니다.'
  }

  const text = await response.text()
  return text || '요청 처리에 실패했습니다.'
}

async function readApiResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return text as T
  }

  return JSON.parse(text) as T
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isFetchNetworkError(error: unknown) {
  return error instanceof TypeError && error.message.toLowerCase().includes('fetch')
}

function wait(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function clearStoredAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('accountRole')
  localStorage.removeItem('accountLoginId')
}

async function assertAuthorizedResponse(response: Response) {
  if (response.status !== 401) return

  clearStoredAuth()
  window.dispatchEvent(new Event('auth-expired'))
  throw new Error(await readApiResponseMessage(response))
}

async function adminFetch<T>(path: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken')
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    if (isFetchNetworkError(error)) {
      await wait(250)
      try {
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        })
      } catch (retryError) {
        if (isAbortError(retryError)) throw retryError
        throw new Error('백엔드 서버 연결에 실패했습니다. 서버 실행 상태와 로그인 토큰을 확인해주세요.', {
          cause: retryError,
        })
      }
    } else {
      throw error
    }
  }

  if (!response.ok) {
    await assertAuthorizedResponse(response)
    throw new Error(await readApiResponseMessage(response))
  }

  return readApiResponse<T>(response)
}

async function authFetch<T>(path: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken')
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    if (isFetchNetworkError(error)) {
      await wait(250)
      try {
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
        })
      } catch (retryError) {
        if (isAbortError(retryError)) throw retryError
        throw new Error('백엔드 서버 연결에 실패했습니다. 서버 실행 상태와 로그인 토큰을 확인해주세요.', {
          cause: retryError,
        })
      }
    } else {
      throw error
    }
  }

  if (!response.ok) {
    await assertAuthorizedResponse(response)
    throw new Error(await readApiResponseMessage(response))
  }

  return readApiResponse<T>(response)
}

function resolveProductCategory(product: ProductApiResponse): Product['category'] {
  const source = [product.name, product.plantType, product.description, product.potIncluded]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (source.includes('화분') || source.includes('pot')) return 'pots'
  if (
    source.includes('도구') ||
    source.includes('흙') ||
    source.includes('배양토') ||
    source.includes('분갈이') ||
    source.includes('tool') ||
    source.includes('soil')
  ) {
    return 'tools'
  }

  return 'plants'
}

const careLevelLabels: Record<string, string> = {
  EASY: '초보 추천',
  NORMAL: '보통 난이도',
  HARD: '관리 주의',
}

const lightRequirementLabels: Record<string, string> = {
  LOW: '반음지',
  MEDIUM: '밝은 간접광',
  HIGH: '충분한 햇빛',
}

const wateringCycleLabels: Record<string, string> = {
  WEEKLY: '주 1회 물주기',
  BIWEEKLY: '2주 1회 물주기',
  MONTHLY: '월 1회 물주기',
}

function toStorefrontProduct(product: ProductApiResponse): Product {
  const category = resolveProductCategory(product)
  const tags = [
    categoryLabels[category],
    product.careLevel ? careLevelLabels[product.careLevel] : null,
    product.lightRequirement ? lightRequirementLabels[product.lightRequirement] : null,
    product.wateringCycle ? wateringCycleLabels[product.wateringCycle] : null,
    product.potIncluded,
  ].filter((tag): tag is string => Boolean(tag))

  return {
    id: product.id,
    name: product.name,
    category,
    price: product.price,
    deliveryFee: 3000,
    shortInfo: product.description || product.plantType || '꽃동산에서 판매 중인 식물 상품입니다.',
    detail: product.description || '상품 상세 설명은 준비 중입니다.',
    tags: tags.length > 0 ? tags : ['식물상품'],
    images: [product.imageUrl || FALLBACK_IMAGE],
  }
}

function matchesProductKeyword(product: Product, keyword: string) {
  if (!keyword) return true

  return [
    product.name,
    categoryLabels[product.category],
    product.shortInfo,
    product.detail,
    product.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase()
    .includes(keyword)
}

function AdminDashboard({ onLogout, onOpenUserView }: { onLogout: () => void; onOpenUserView: () => void }) {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null)
  const [activeSection, setActiveSection] = useState<AdminSectionId>('orders')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshDashboard = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      setDashboard(await adminFetch<AdminDashboardResponse>('/admin/dashboard', { signal }))
    } catch (error) {
      if (isAbortError(error)) return
      setErrorMessage(error instanceof Error ? error.message : '관리자 메인 정보를 불러오지 못했습니다.')
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      refreshDashboard(controller.signal)
    }, 0)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [refreshDashboard])

  const todayCards = [
    { label: '회원 가입', value: dashboard?.todayStatus.memberSignupCount ?? 0, unit: '명' },
    { label: '회원 탈퇴', value: dashboard?.todayStatus.memberWithdrawalCount ?? 0, unit: '명' },
    { label: '상품 등록건', value: dashboard?.todayStatus.productCreatedCount ?? 0, unit: '건' },
    { label: '주문 건', value: dashboard?.todayStatus.orderCount ?? 0, unit: '건' },
  ]

  const pendingCards = [
    { label: '허위 상품 신고', value: dashboard?.pendingStatus.productReportCount ?? 0 },
    { label: '교환/환불 신청', value: dashboard?.pendingStatus.exchangeRefundCount ?? 0 },
    { label: '1:1 문의', value: dashboard?.pendingStatus.oneToOneInquiryCount ?? 0 },
    { label: '상품 문의', value: dashboard?.pendingStatus.productInquiryCount ?? 0 },
    { label: '판매자 승인', value: dashboard?.pendingStatus.sellerApprovalCount ?? 0 },
    { label: '주문 처리', value: dashboard?.pendingStatus.orderProcessingCount ?? 0 },
  ]

  const marketplaceCards = [
    { label: '판매자 승인 대기', value: dashboard?.marketplaceStatus.sellerApprovalWaitingCount ?? 0, unit: '건' },
    { label: '오늘 신규 판매자 가입', value: dashboard?.marketplaceStatus.todaySellerSignupCount ?? 0, unit: '명' },
    { label: '정산 대기 금액', value: dashboard?.marketplaceStatus.settlementPendingAmount ?? 0, unit: '원', isMoney: true },
    { label: '신고된 상품', value: dashboard?.marketplaceStatus.reportedProductCount ?? 0, unit: '건' },
    { label: '신고된 리뷰', value: dashboard?.marketplaceStatus.reportedReviewCount ?? 0, unit: '건' },
    { label: '판매 중지 상품', value: dashboard?.marketplaceStatus.suspendedProductCount ?? 0, unit: '개' },
  ]

  const activeMenu = adminMenus.find((menu) => menu.id === activeSection) ?? adminMenus[0]

  return (
    <main className="admin-console">
      <header className="admin-header">
        <div>
          <span>flower garden admin</span>
          <h1>관리자 메인</h1>
          <p>{dashboard ? `${dashboard.loginId} 관리자` : '관리자 정보를 확인 중입니다.'}</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" onClick={onOpenUserView}>
            이용자 화면 보기
          </button>
          <button type="button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </header>

      <nav className="admin-nav" aria-label="관리자 메뉴">
        {adminMenus.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeSection === item.id ? 'is-active' : ''}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {isLoading && <section className="admin-panel">관리자 메인 정보를 불러오고 있습니다.</section>}
      {errorMessage && <section className="admin-panel admin-error">{errorMessage}</section>}

      {!isLoading && !errorMessage && dashboard && (
        <>
          <section className="admin-overview-grid">
            <article className="admin-panel admin-account-panel">
              <h2>{dashboard.loginId}</h2>
              <div>
                <h3>자주 이용하는 메뉴</h3>
                <div className="admin-quick-grid">
                  {dashboard.quickMenus.map((menu) => (
                    <button key={menu.target} type="button" onClick={() => setActiveSection(toAdminSection(menu.target))}>
                      {menu.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-domain">
                <span>도메인 만료일</span>
                <strong>{dashboard.domainExpiresAt}</strong>
                <em>{dashboard.domainDday}일 남음</em>
              </div>
            </article>

            <article className="admin-panel">
              <h2>Today 현황 <span>{dashboard.today}</span></h2>
              <div className="admin-stat-grid">
                {todayCards.map((card) => (
                  <div key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value.toLocaleString()}{card.unit}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <h2>미처리 현황</h2>
              <div className="admin-stat-grid">
                {pendingCards.map((card) => (
                  <div key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value.toLocaleString()}건</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel admin-marketplace-panel">
              <h2>오픈마켓 운영 지표</h2>
              <div className="admin-stat-grid">
                {marketplaceCards.map((card) => (
                  <div key={card.label}>
                    <span>{card.label}</span>
                    <strong>{formatAdminMetric(card.value, card.unit, card.isMoney)}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-section-panel">
            <div className="admin-section-heading">
              <span>관리 메뉴</span>
              <h2>{activeMenu.label}</h2>
            </div>
            <AdminSectionContent
              key={activeSection}
              section={activeSection}
              dashboard={dashboard}
              onRefreshDashboard={() => refreshDashboard()}
            />
          </section>

          <section className="admin-board-grid">
            <AdminBoard title="사내 사이트 개선 사항" posts={dashboard.improvementPosts} />
            <AdminBoard title="업무 매뉴얼" posts={dashboard.manualPosts} />
          </section>
        </>
      )}
    </main>
  )
}

function toAdminSection(target: string): AdminSectionId {
  if (target === 'policy') return 'policies'
  if (target === 'statistics') return 'statistics'
  if (target === 'products') return 'products'
  if (target === 'members') return 'members'
  if (target === 'boards') return 'boards'
  return 'orders'
}

function formatAdminMetric(value: number, unit: string, isMoney = false) {
  return `${value.toLocaleString()}${unit}${isMoney ? '' : ''}`
}

function AdminSectionContent({
  section,
  dashboard,
  onRefreshDashboard,
}: {
  section: AdminSectionId
  dashboard: AdminDashboardResponse
  onRefreshDashboard: () => void
}) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [members, setMembers] = useState<AdminMember[]>([])
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [adminProducts, setAdminProducts] = useState<AdminProduct[]>([])
  const [policies, setPolicies] = useState<AdminPolicy[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [settlements, setSettlements] = useState<AdminSettlement[]>([])
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ totalElements: 0, totalPages: 0 })
  const [isSectionLoading, setIsSectionLoading] = useState(false)
  const [sectionMessage, setSectionMessage] = useState('')

  const buildAdminQuery = useCallback((extra: Record<string, string> = {}, includeStatus = true) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', '10')

    if (filterKeyword.trim()) {
      params.set('keyword', filterKeyword.trim())
    }

    if (includeStatus && filterStatus) {
      params.set('status', filterStatus)
    }

    Object.entries(extra).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    return params.toString()
  }, [filterKeyword, filterStatus, page])

  function applyPage<T>(pageResponse: AdminPage<T>, setter: (items: T[]) => void) {
    setter(pageResponse.items)
    setPageInfo({ totalElements: pageResponse.totalElements, totalPages: pageResponse.totalPages })
  }

  const loadSection = useCallback(async () => {
    setIsSectionLoading(true)
    setSectionMessage('')

    try {
      if (section === 'orders') {
        const [nextOrders, nextSettlements] = await Promise.all([
          adminFetch<AdminPage<AdminOrder>>(`/admin/orders?${buildAdminQuery()}`),
          adminFetch<AdminPage<AdminSettlement>>('/admin/settlements?page=0&size=10'),
        ])
        applyPage(nextOrders, setOrders)
        setSettlements(nextSettlements.items)
      }

      if (section === 'members') {
        const [nextMembers, nextSellers] = await Promise.all([
          adminFetch<AdminPage<AdminMember>>(`/admin/members?${buildAdminQuery()}`),
          adminFetch<AdminSeller[]>('/admin/sellers'),
        ])
        applyPage(nextMembers, setMembers)
        setSellers(nextSellers)
      }

      if (section === 'products') {
        const [nextProducts, nextReports] = await Promise.all([
          adminFetch<AdminPage<AdminProduct>>(`/admin/products?${buildAdminQuery()}`),
          adminFetch<AdminPage<AdminReport>>('/admin/reports?page=0&size=10'),
        ])
        applyPage(nextProducts, setAdminProducts)
        setReports(nextReports.items)
      }

      if (section === 'boards') {
        const [nextPosts, nextInquiries] = await Promise.all([
          adminFetch<AdminPage<AdminPost>>(`/admin/boards?${buildAdminQuery()}`),
          adminFetch<AdminPage<AdminInquiry>>('/admin/inquiries?page=0&size=10'),
        ])
        applyPage(nextPosts, setPosts)
        setInquiries(nextInquiries.items)
      }

      if (section === 'statistics') {
        const [nextOrders, nextSettlements, nextReports] = await Promise.all([
          adminFetch<AdminPage<AdminOrder>>('/admin/orders?page=0&size=10'),
          adminFetch<AdminPage<AdminSettlement>>(`/admin/settlements?${buildAdminQuery()}`),
          adminFetch<AdminPage<AdminReport>>('/admin/reports?page=0&size=10'),
        ])
        setOrders(nextOrders.items)
        applyPage(nextSettlements, setSettlements)
        setReports(nextReports.items)
      }

      if (section === 'policies') {
        const nextPolicies = await adminFetch<AdminPage<AdminPolicy>>(`/admin/policies?${buildAdminQuery()}`)
        applyPage(nextPolicies, setPolicies)
      }
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '관리자 메뉴 정보를 불러오지 못했습니다.')
    } finally {
      setIsSectionLoading(false)
    }
  }, [buildAdminQuery, section])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadSection()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadSection])

  async function runAdminAction(action: () => Promise<void>, successMessage: string) {
    setSectionMessage('')

    try {
      await action()
      setSectionMessage(successMessage)
      await loadSection()
      onRefreshDashboard()
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '요청 처리에 실패했습니다.')
    }
  }

  function askRequired(message: string, defaultValue = '') {
    const value = window.prompt(message, defaultValue)?.trim()
    return value || null
  }

  async function savePolicy() {
    const policyKey = askRequired('정책 키를 입력하세요.', 'sales-policy')
    if (!policyKey) return
    const title = askRequired('정책 제목을 입력하세요.', '판매 정책')
    if (!title) return
    const content = askRequired('정책 내용을 입력하세요.', '정책 내용을 입력하세요.')
    if (!content) return

    await runAdminAction(
      () => adminFetch('/admin/policies', {
        method: 'POST',
        body: JSON.stringify({ policyKey, title, content }),
      }),
      '정책을 저장했습니다.',
    )
  }

  async function createPost() {
    const type = askRequired('게시글 유형을 입력하세요. NOTICE, IMPROVEMENT, MANUAL', 'NOTICE')
    if (!type) return
    const title = askRequired('게시글 제목을 입력하세요.')
    if (!title) return
    const content = askRequired('게시글 내용을 입력하세요.')
    if (!content) return

    await runAdminAction(
      () => adminFetch('/admin/boards', {
        method: 'POST',
        body: JSON.stringify({ type, title, content }),
      }),
      '게시글을 등록했습니다.',
    )
  }

  async function createReport(targetType: 'PRODUCT' | 'REVIEW') {
    const targetId = Number(askRequired(`${targetType === 'PRODUCT' ? '상품' : '리뷰'} ID를 입력하세요.`))
    if (!targetId) return
    const reason = askRequired('신고 사유를 입력하세요.')
    if (!reason) return

    await runAdminAction(
      () => adminFetch('/admin/reports', {
        method: 'POST',
        body: JSON.stringify({ targetType, targetId, reason }),
      }),
      '신고를 등록했습니다.',
    )
  }

  async function createSettlement() {
    const sellerProfileId = Number(askRequired('판매자 프로필 ID를 입력하세요.'))
    if (!sellerProfileId) return
    const amount = Number(askRequired('정산 금액을 입력하세요.'))
    if (!amount) return

    await runAdminAction(
      () => adminFetch('/admin/settlements', {
        method: 'POST',
        body: JSON.stringify({ sellerProfileId, amount }),
      }),
      '정산 대기 건을 등록했습니다.',
    )
  }

  function getStatusOptions() {
    if (section === 'orders') return ['CREATED', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (section === 'members') return ['ACTIVE', 'SUSPENDED', 'DELETED']
    if (section === 'products') return ['ON_SALE', 'SOLD_OUT', 'HIDDEN']
    if (section === 'statistics') return ['PENDING', 'COMPLETED']
    return []
  }

  const statusOptions = getStatusOptions()

  const sectionRows: Record<AdminSectionId, { title: string; value: string; description: string }[]> = {
    orders: [
      { title: '오늘 주문', value: `${dashboard.todayStatus.orderCount.toLocaleString()}건`, description: '오늘 생성된 전체 주문 수' },
      { title: '처리 대기 주문', value: `${dashboard.pendingStatus.orderProcessingCount.toLocaleString()}건`, description: '결제 완료 이후 배송 준비가 필요한 주문' },
      { title: '교환/환불 신청', value: `${dashboard.pendingStatus.exchangeRefundCount.toLocaleString()}건`, description: '처리 전 교환 및 환불 요청' },
    ],
    boards: [
      { title: '사내 개선 사항', value: `${dashboard.improvementPosts.length.toLocaleString()}건`, description: '운영자가 확인할 내부 개선 요청' },
      { title: '업무 매뉴얼', value: `${dashboard.manualPosts.length.toLocaleString()}건`, description: '운영 처리 기준과 반복 업무 문서' },
      { title: '1:1 문의', value: `${dashboard.pendingStatus.oneToOneInquiryCount.toLocaleString()}건`, description: '답변 대기 중인 고객 문의' },
    ],
    members: [
      { title: '오늘 회원 가입', value: `${dashboard.todayStatus.memberSignupCount.toLocaleString()}명`, description: '오늘 신규 가입한 구매자와 판매자' },
      { title: '오늘 회원 탈퇴', value: `${dashboard.todayStatus.memberWithdrawalCount.toLocaleString()}명`, description: '탈퇴 처리된 회원' },
      { title: '판매자 승인 대기', value: `${dashboard.marketplaceStatus.sellerApprovalWaitingCount.toLocaleString()}건`, description: '관리자 승인이 필요한 판매자 신청' },
    ],
    products: [
      { title: '오늘 등록 상품', value: `${dashboard.todayStatus.productCreatedCount.toLocaleString()}건`, description: '신규 상품과 메인 노출 상품을 함께 관리' },
      { title: '판매 중지 상품', value: `${dashboard.marketplaceStatus.suspendedProductCount.toLocaleString()}개`, description: '숨김 또는 판매 중지 상태의 상품' },
      { title: '상품 문의', value: `${dashboard.pendingStatus.productInquiryCount.toLocaleString()}건`, description: '답변 대기 중인 상품 문의' },
    ],
    statistics: [
      { title: '오늘 주문', value: `${dashboard.todayStatus.orderCount.toLocaleString()}건`, description: '일간 주문 추이 확인 기준' },
      { title: '정산 대기 금액', value: `${dashboard.marketplaceStatus.settlementPendingAmount.toLocaleString()}원`, description: '정산 처리 전 주문 금액 합계' },
      { title: '오늘 신규 판매자', value: `${dashboard.marketplaceStatus.todaySellerSignupCount.toLocaleString()}명`, description: '오늘 판매자로 가입한 계정' },
    ],
    policies: [
      { title: '판매 정책', value: '기본 정책', description: '상품 등록, 판매 중지, 검수 기준' },
      { title: '정산 정책', value: '기본 정책', description: '정산 대기와 지급 기준' },
      { title: '신고 처리 정책', value: '기본 정책', description: '상품과 리뷰 신고 처리 기준' },
    ],
  }

  return (
    <>
      <div className="admin-section-grid">
        {sectionRows[section].map((row) => (
          <article key={row.title}>
            <span>{row.title}</span>
            <strong>{row.value}</strong>
            <p>{row.description}</p>
          </article>
        ))}
      </div>

      <div className="admin-section-toolbar">
        <input
          value={filterKeyword}
          onChange={(event) => {
            setPage(0)
            setFilterKeyword(event.target.value)
          }}
          placeholder="검색어"
          aria-label="관리자 목록 검색어"
        />
        {statusOptions.length > 0 && (
          <select
            value={filterStatus}
            onChange={(event) => {
              setPage(0)
              setFilterStatus(event.target.value)
            }}
            aria-label="관리자 목록 상태 필터"
          >
            <option value="">전체 상태</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        )}
        {section === 'policies' && <button type="button" onClick={savePolicy}>정책 저장</button>}
        {section === 'boards' && <button type="button" onClick={createPost}>게시글 등록</button>}
        {section === 'products' && (
          <>
            <button type="button" onClick={() => createReport('PRODUCT')}>상품 신고 등록</button>
            <button type="button" onClick={() => createReport('REVIEW')}>리뷰 신고 등록</button>
          </>
        )}
        {(section === 'orders' || section === 'statistics') && (
          <button type="button" onClick={createSettlement}>정산 등록</button>
        )}
      </div>

      {isSectionLoading && <p className="admin-section-message">목록을 불러오는 중입니다.</p>}
      {sectionMessage && <p className="admin-section-message">{sectionMessage}</p>}

      <div className="admin-pagination">
        <span>
          총 {pageInfo.totalElements.toLocaleString()}건
          {pageInfo.totalPages > 0 ? ` · ${page + 1}/${pageInfo.totalPages}페이지` : ''}
        </span>
        <div>
          <button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>
            이전
          </button>
          <button
            type="button"
            disabled={pageInfo.totalPages === 0 || page + 1 >= pageInfo.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            다음
          </button>
        </div>
      </div>

      {section === 'orders' && (
        <AdminTable
          headers={['주문번호', '수령인', '금액', '상태']}
          rows={orders.map((order) => ({
            id: order.orderId,
            cells: [order.orderNumber, order.name, `${order.totalPrice.toLocaleString()}원`, order.status],
          }))}
        />
      )}

      {section === 'members' && (
        <>
          <AdminTable
            headers={['회원', '이메일', '역할', '상태', '처리']}
            rows={members.map((member) => ({
              id: member.id,
              cells: [member.loginId, member.email, member.role, member.status],
              actions: (
                <>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/members/${member.id}/suspend`, { method: 'PATCH' }), '회원을 정지했습니다.')}>정지</button>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/members/${member.id}`, { method: 'DELETE' }), '회원을 탈퇴 처리했습니다.')}>삭제</button>
                </>
              ),
            }))}
          />
          <AdminTable
            title="판매자 승인 관리"
            headers={['스토어', '아이디', '상태', '처리']}
            rows={sellers.map((seller) => ({
              id: seller.id,
              cells: [seller.storeName, seller.loginId, seller.approvalStatus],
              actions: (
                <>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/sellers/${seller.id}/approve`, { method: 'PATCH' }), '판매자를 승인했습니다.')}>승인</button>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/sellers/${seller.id}/suspend`, { method: 'PATCH' }), '판매자를 정지했습니다.')}>정지</button>
                </>
              ),
            }))}
          />
        </>
      )}

      {section === 'products' && (
        <>
          <AdminTable
            headers={['상품명', '종류', '가격', '재고', '상태', '처리']}
            rows={adminProducts.map((product) => ({
              id: product.id,
              cells: [product.name, product.plantType, `${product.price.toLocaleString()}원`, `${product.stock}`, product.status],
              actions: (
                <>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/products/${product.id}/hide`, { method: 'PATCH' }), '상품을 숨김 처리했습니다.')}>숨김</button>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/products/${product.id}/restore`, { method: 'PATCH' }), '상품을 복구했습니다.')}>복구</button>
                  <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/products/${product.id}`, { method: 'DELETE' }), '상품을 삭제했습니다.')}>삭제</button>
                </>
              ),
            }))}
          />
          <AdminTable
            title="신고 관리"
            headers={['대상', '대상 ID', '사유', '상태', '처리']}
            rows={reports.map((report) => ({
              id: report.id,
              cells: [report.targetType, `${report.targetId}`, report.reason, report.status],
              actions: <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/reports/${report.id}/resolve`, { method: 'PATCH' }), '신고를 처리했습니다.')}>처리완료</button>,
            }))}
          />
        </>
      )}

      {section === 'boards' && (
        <>
          <AdminTable
            headers={['유형', '제목', '작성자', '처리']}
            rows={posts.map((post) => ({
              id: post.id,
              cells: [post.type, post.title, post.authorLoginId],
              actions: <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/boards/${post.id}`, { method: 'DELETE' }), '게시글을 삭제했습니다.')}>삭제</button>,
            }))}
          />
          <AdminTable
            title="문의 관리"
            headers={['작성자', '제목', '상태', '처리']}
            rows={inquiries.map((inquiry) => ({
              id: inquiry.id,
              cells: [inquiry.authorLoginId, inquiry.title, inquiry.status],
              actions: <button type="button" onClick={() => {
                const answer = askRequired('답변 내용을 입력하세요.', inquiry.answer ?? '')
                if (!answer) return
                runAdminAction(() => adminFetch(`/admin/inquiries/${inquiry.id}/answer`, {
                  method: 'PATCH',
                  body: JSON.stringify({ answer }),
                }), '문의에 답변했습니다.')
              }}>답변</button>,
            }))}
          />
        </>
      )}

      {section === 'statistics' && (
        <AdminTable
          headers={['정산 ID', '스토어', '금액', '상태', '처리']}
          rows={settlements.map((settlement) => ({
            id: settlement.id,
            cells: [`#${settlement.id}`, settlement.storeName, `${settlement.amount.toLocaleString()}원`, settlement.status],
            actions: <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/settlements/${settlement.id}/complete`, { method: 'PATCH' }), '정산을 완료했습니다.')}>완료</button>,
          }))}
        />
      )}

      {section === 'policies' && (
        <AdminTable
          headers={['정책 키', '제목', '내용']}
          rows={(policies.length > 0 ? policies : defaultAdminPolicies).map((policy) => ({
            id: policy.id,
            cells: [policy.policyKey, policy.title, policy.content],
          }))}
        />
      )}
    </>
  )
}

function AdminTable({
  title,
  headers,
  rows,
}: {
  title?: string
  headers: string[]
  rows: { id: number; cells: string[]; actions?: ReactNode }[]
}) {
  return (
    <div className="admin-table-wrap">
      {title && <h3>{title}</h3>}
      <table className="admin-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length}>표시할 데이터가 없습니다.</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                {row.cells.map((cell, index) => (
                  <td key={`${row.id}-${headers[index]}`}>{cell}</td>
                ))}
                {row.actions && <td className="admin-table-actions">{row.actions}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function AdminBoard({ title, posts }: { title: string; posts: AdminBoardPost[] }) {
  return (
    <article className="admin-panel admin-board">
      <div className="admin-board-heading">
        <h2>{title}</h2>
        <button type="button" aria-label={`${title} 더보기`}>
          ›
        </button>
      </div>
      <ul>
        {posts.map((post) => (
          <li key={`${post.title}-${post.authorLoginId}`}>
            <span>{post.title}</span>
            <em>{post.authorLoginId}</em>
            <time>{post.createdDate}</time>
          </li>
        ))}
      </ul>
    </article>
  )
}

function SellerCenterPage({
  onBack,
  onProductsChanged,
}: {
  onBack: () => void
  onProductsChanged: () => Promise<void>
}) {
  function createDefaultProductForm(): SellerProductForm {
    return {
      name: '',
      plantType: 'plants',
      careLevel: 'EASY',
      lightRequirement: 'MEDIUM',
      wateringCycle: 'BIWEEKLY',
      imageUrl: FALLBACK_IMAGE,
      potIncluded: '기본 포트 포함',
      description: '',
      price: '',
      stock: '20',
      status: 'ON_SALE',
    }
  }

  function toCareLevel(value: string | null | undefined): SellerProductForm['careLevel'] {
    return value === 'NORMAL' || value === 'HARD' ? value : 'EASY'
  }

  function toLightRequirement(value: string | null | undefined): SellerProductForm['lightRequirement'] {
    return value === 'LOW' || value === 'HIGH' ? value : 'MEDIUM'
  }

  function toWateringCycle(value: string | null | undefined): SellerProductForm['wateringCycle'] {
    return value === 'WEEKLY' || value === 'MONTHLY' ? value : 'BIWEEKLY'
  }

  function toProductStatus(value: string | null | undefined): SellerProductForm['status'] {
    return value === 'SOLD_OUT' || value === 'HIDDEN' ? value : 'ON_SALE'
  }

  const [dashboard, setDashboard] = useState<SellerDashboardResponse | null>(null)
  const [activeSection, setActiveSection] = useState<SellerSection>('register')
  const [products, setProducts] = useState<SellerProductResponse[]>([])
  const [orders, setOrders] = useState<SellerOrderResponse[]>([])
  const [sales, setSales] = useState<SellerSalesResponse | null>(null)
  const [inquiries, setInquiries] = useState<SellerInquiryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSectionLoading, setIsSectionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sectionMessage, setSectionMessage] = useState('')
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productForm, setProductForm] = useState<SellerProductForm>(createDefaultProductForm)

  const sellerSections: Array<{ id: SellerSection; label: string }> = [
    { id: 'register', label: '상품 등록' },
    { id: 'products', label: '상품 관리' },
    { id: 'orders', label: '주문 관리' },
    { id: 'sales', label: '매출 관리' },
    { id: 'inquiries', label: '문의 관리' },
    { id: 'settlements', label: '정산 내역' },
  ]

  useEffect(() => {
    const controller = new AbortController()

    authFetch<SellerDashboardResponse>('/seller-center/dashboard', { signal: controller.signal })
      .then((data) => {
        setDashboard(data)
        setMessage('')
      })
      .catch((error) => {
        if (isAbortError(error)) return
        setMessage(error instanceof Error ? error.message : '판매자 센터 정보를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [])

  const isApprovedSeller = dashboard?.profile.approvalStatus === 'APPROVED'

  const loadSellerSection = useCallback(async (section: SellerSection) => {
    if (!isApprovedSeller) return

    setIsSectionLoading(true)
    setSectionMessage('')

    try {
      if (section === 'products') {
        setProducts(await authFetch<SellerProductResponse[]>('/seller-center/products'))
      }

      if (section === 'orders') {
        setOrders(await authFetch<SellerOrderResponse[]>('/seller-center/orders'))
      }

      if (section === 'sales' || section === 'settlements') {
        setSales(await authFetch<SellerSalesResponse>('/seller-center/sales'))
      }

      if (section === 'inquiries') {
        setInquiries(await authFetch<SellerInquiryResponse[]>('/seller-center/inquiries'))
      }
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '판매자 업무 정보를 불러오지 못했습니다.')
    } finally {
      setIsSectionLoading(false)
    }
  }, [isApprovedSeller])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadSellerSection(activeSection)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [activeSection, loadSellerSection])

  const stats = dashboard
    ? [
        { label: '오늘 매출', value: `${dashboard.todaySalesAmount.toLocaleString()}원` },
        { label: '월 매출', value: `${dashboard.monthlySalesAmount.toLocaleString()}원` },
        { label: '주문', value: `${dashboard.orderCount.toLocaleString()}건` },
        { label: '상품', value: `${dashboard.productCount.toLocaleString()}개` },
        { label: '배송 준비', value: `${dashboard.preparingDeliveryCount.toLocaleString()}건` },
        { label: '오늘 정산', value: `${dashboard.todaySettlementAmount.toLocaleString()}원` },
      ]
    : []

  function changeProductForm(field: keyof SellerProductForm, value: string) {
    setProductForm((form) => ({ ...form, [field]: value }))
  }

  function resetProductForm() {
    setEditingProductId(null)
    setProductForm(createDefaultProductForm())
  }

  function createProductPayload() {
    return {
      name: productForm.name,
      plantType: productForm.plantType,
      careLevel: productForm.careLevel,
      lightRequirement: productForm.lightRequirement,
      wateringCycle: productForm.wateringCycle,
      imageUrl: productForm.imageUrl || FALLBACK_IMAGE,
      potIncluded: productForm.potIncluded,
      description: productForm.description,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      status: productForm.status,
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSectionMessage('')

    const payload = createProductPayload()
    if (!payload.name || !payload.description || payload.price <= 0 || payload.stock < 0) {
      setSectionMessage('상품명, 설명, 가격, 재고를 확인해주세요.')
      return
    }

    try {
      if (editingProductId) {
        await authFetch(`/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setSectionMessage('상품 정보를 수정했습니다.')
      } else {
        await authFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setSectionMessage('상품을 등록했습니다.')
      }
      resetProductForm()
      await loadSellerSection('products')
      await onProductsChanged()
      setActiveSection('products')
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '상품 저장에 실패했습니다.')
    }
  }

  async function editProduct(productId: number) {
    setSectionMessage('')

    try {
      const product = await authFetch<ProductApiResponse>(`/products/${productId}`)
      setEditingProductId(product.id)
      setProductForm({
        name: product.name,
        plantType: product.plantType ?? 'plants',
        careLevel: toCareLevel(product.careLevel),
        lightRequirement: toLightRequirement(product.lightRequirement),
        wateringCycle: toWateringCycle(product.wateringCycle),
        imageUrl: product.imageUrl ?? FALLBACK_IMAGE,
        potIncluded: product.potIncluded ?? '기본 포트 포함',
        description: product.description ?? '',
        price: String(product.price),
        stock: String(product.stock),
        status: toProductStatus(product.status),
      })
      setActiveSection('register')
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '상품 상세 정보를 불러오지 못했습니다.')
    }
  }

  async function deleteProduct(productId: number) {
    setSectionMessage('')

    try {
      await authFetch(`/products/${productId}`, { method: 'DELETE' })
      setSectionMessage('상품을 판매 중지 처리했습니다.')
      await loadSellerSection('products')
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.')
    }
  }

  function renderSellerSection() {
    if (!isApprovedSeller) {
      return (
        <section className="role-panel">
          <h2>승인 대기</h2>
          <p>관리자 승인 후 상품 등록, 주문 관리, 매출 관리 기능을 사용할 수 있습니다.</p>
        </section>
      )
    }

    if (activeSection === 'register') {
      return (
        <section className="role-panel seller-work-panel">
          <div className="seller-section-heading">
            <h2>{editingProductId ? '상품 수정' : '상품 등록'}</h2>
            {editingProductId && <button type="button" onClick={resetProductForm}>새 상품 등록</button>}
          </div>
          <form className="seller-product-form" onSubmit={submitProduct}>
            <label>
              상품명
              <input value={productForm.name} onChange={(event) => changeProductForm('name', event.target.value)} />
            </label>
            <label>
              상품 분류
              <select value={productForm.plantType} onChange={(event) => changeProductForm('plantType', event.target.value)}>
                <option value="plants">다육식물</option>
                <option value="pots">화분</option>
                <option value="tools">보조도구</option>
              </select>
            </label>
            <label>
              관리 난이도
              <select value={productForm.careLevel} onChange={(event) => changeProductForm('careLevel', event.target.value)}>
                <option value="EASY">쉬움</option>
                <option value="NORMAL">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </label>
            <label>
              햇빛
              <select value={productForm.lightRequirement} onChange={(event) => changeProductForm('lightRequirement', event.target.value)}>
                <option value="LOW">낮음</option>
                <option value="MEDIUM">보통</option>
                <option value="HIGH">높음</option>
              </select>
            </label>
            <label>
              물주기
              <select value={productForm.wateringCycle} onChange={(event) => changeProductForm('wateringCycle', event.target.value)}>
                <option value="WEEKLY">매주</option>
                <option value="BIWEEKLY">2주마다</option>
                <option value="MONTHLY">매월</option>
              </select>
            </label>
            <label>
              이미지 URL
              <input value={productForm.imageUrl} onChange={(event) => changeProductForm('imageUrl', event.target.value)} />
            </label>
            <label>
              화분 포함
              <input value={productForm.potIncluded} onChange={(event) => changeProductForm('potIncluded', event.target.value)} />
            </label>
            <label>
              가격
              <input type="number" min="1" value={productForm.price} onChange={(event) => changeProductForm('price', event.target.value)} />
            </label>
            <label>
              재고
              <input type="number" min="0" value={productForm.stock} onChange={(event) => changeProductForm('stock', event.target.value)} />
            </label>
            <label>
              판매 상태
              <select value={productForm.status} onChange={(event) => changeProductForm('status', event.target.value)}>
                <option value="ON_SALE">판매중</option>
                <option value="SOLD_OUT">품절</option>
                <option value="HIDDEN">숨김</option>
              </select>
            </label>
            <label className="seller-form-wide">
              상품 설명
              <textarea value={productForm.description} onChange={(event) => changeProductForm('description', event.target.value)} />
            </label>
            <button type="submit">{editingProductId ? '상품 수정' : '상품 등록'}</button>
          </form>
        </section>
      )
    }

    if (activeSection === 'products') {
      return (
        <section className="role-panel seller-work-panel">
          <h2>상품 관리</h2>
          {products.length === 0 ? (
            <p>등록된 상품이 없습니다.</p>
          ) : (
            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>상품</th>
                    <th>가격</th>
                    <th>재고</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <span className="seller-product-cell">
                          <img src={product.imageUrl || FALLBACK_IMAGE} alt={product.name} />
                          {product.name}
                        </span>
                      </td>
                      <td>{product.price.toLocaleString()}원</td>
                      <td>{product.stock.toLocaleString()}개</td>
                      <td>{product.status}</td>
                      <td>
                        <button type="button" onClick={() => editProduct(product.id)}>수정</button>
                        <button type="button" onClick={() => deleteProduct(product.id)}>판매 중지</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )
    }

    if (activeSection === 'orders') {
      return (
        <section className="role-panel seller-work-panel">
          <h2>주문 관리</h2>
          {orders.length === 0 ? (
            <p>주문 내역이 없습니다.</p>
          ) : (
            <ul className="seller-card-list">
              {orders.map((order) => (
                <li key={order.id}>
                  <strong>{order.orderNumber}</strong>
                  <span>{order.status}</span>
                  <p>{order.receiverName} · {order.receiverPhone} · {order.shippingAddress}</p>
                  <em>{order.totalPrice.toLocaleString()}원</em>
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    }

    if (activeSection === 'sales') {
      return (
        <section className="role-panel seller-work-panel">
          <h2>매출 관리</h2>
          <div className="seller-metric-grid">
            <article><span>오늘 매출</span><strong>{(sales?.todaySalesAmount ?? 0).toLocaleString()}원</strong></article>
            <article><span>월 매출</span><strong>{(sales?.monthlySalesAmount ?? 0).toLocaleString()}원</strong></article>
            <article><span>결제 주문</span><strong>{(sales?.orderCount ?? 0).toLocaleString()}건</strong></article>
            <article><span>평균 주문 금액</span><strong>{(sales?.averageOrderAmount ?? 0).toLocaleString()}원</strong></article>
          </div>
        </section>
      )
    }

    if (activeSection === 'inquiries') {
      return (
        <section className="role-panel seller-work-panel">
          <h2>문의 관리</h2>
          {inquiries.length === 0 ? (
            <p>등록된 문의가 없습니다.</p>
          ) : (
            <ul className="seller-card-list">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <strong>{inquiry.title}</strong>
                  <span>{inquiry.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )
    }

    return (
      <section className="role-panel seller-work-panel">
        <h2>정산 내역</h2>
        <div className="seller-metric-grid">
          <article><span>정산 가능 매출</span><strong>{(sales?.monthlySalesAmount ?? 0).toLocaleString()}원</strong></article>
          <article><span>오늘 정산</span><strong>{(dashboard?.todaySettlementAmount ?? 0).toLocaleString()}원</strong></article>
          <article><span>결제 완료 주문</span><strong>{(sales?.orderCount ?? 0).toLocaleString()}건</strong></article>
          <article><span>정산 상태</span><strong>대기</strong></article>
        </div>
      </section>
    )
  }

  return (
    <main className="storefront">
      <section className="role-page role-page-seller">
        <div className="role-page-heading">
          <div>
            <span>seller center</span>
            <h1>{dashboard?.profile.storeName ?? '판매자 센터'}</h1>
            <p>
              {dashboard
                ? `승인 상태: ${dashboard.profile.approvalStatus}`
                : '상품, 주문, 매출 현황을 불러오고 있습니다.'}
            </p>
          </div>
          <button type="button" onClick={onBack}>
            이용자 화면 보기
          </button>
        </div>

        {isLoading && <p className="role-message">판매자 센터 정보를 불러오고 있습니다.</p>}
        {message && <p className="role-message role-message-error">{message}</p>}

        {dashboard && (
          <>
            <div className="role-stat-grid">
              {stats.map((stat) => (
                <article key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>

            <section className="role-panel">
              <h2>판매자 업무</h2>
              <div className="role-action-grid">
                {sellerSections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className={activeSection === section.id ? 'is-active' : ''}
                    disabled={!isApprovedSeller}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </section>

            {isSectionLoading && <p className="role-message">판매자 업무 정보를 불러오고 있습니다.</p>}
            {sectionMessage && <p className="role-message">{sectionMessage}</p>}
            {renderSellerSection()}

            <section className="role-panel">
              <h2>공지</h2>
              {dashboard.notices.length === 0 ? (
                <p>등록된 공지가 없습니다.</p>
              ) : (
                <ul className="role-list">
                  {dashboard.notices.map((notice) => (
                    <li key={notice}>{notice}</li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  )
}

function MyPage({
  cart,
  wishlist,
  cartTotal,
  onBack,
  onOpenShop,
}: {
  cart: CartItem[]
  wishlist: Product[]
  cartTotal: number
  onBack: () => void
  onOpenShop: () => void
}) {
  const [orders, setOrders] = useState<OrderHistoryResponse[]>([])
  const [isOrderLoading, setIsOrderLoading] = useState(true)
  const [orderMessage, setOrderMessage] = useState('')
  const paidOrderCount = orders.filter((order) => order.status === 'PAID').length

  useEffect(() => {
    const controller = new AbortController()

    authFetch<OrderHistoryResponse[]>('/orders/member/me', { signal: controller.signal })
      .then((data) => {
        setOrders(data)
        setOrderMessage('')
      })
      .catch((error) => {
        if (isAbortError(error)) return
        setOrderMessage(error instanceof Error ? error.message : '주문 내역을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsOrderLoading(false)
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="storefront">
      <section className="role-page">
        <div className="role-page-heading">
          <div>
            <span>my page</span>
            <h1>사용자 페이지</h1>
            <p>장바구니, 찜한 상품, 주문과 리뷰 관리 화면입니다.</p>
          </div>
          <button type="button" onClick={onBack}>
            쇼핑 계속하기
          </button>
        </div>

        <div className="role-stat-grid">
          <article>
            <span>장바구니</span>
            <strong>{cart.length.toLocaleString()}개</strong>
          </article>
          <article>
            <span>찜한 상품</span>
            <strong>{wishlist.length.toLocaleString()}개</strong>
          </article>
          <article>
            <span>결제 예정</span>
            <strong>{cartTotal.toLocaleString()}원</strong>
          </article>
          <article>
            <span>결제 완료</span>
            <strong>{paidOrderCount.toLocaleString()}건</strong>
          </article>
        </div>

        <div className="role-two-column">
          <section className="role-panel">
            <h2>장바구니</h2>
            {cart.length === 0 ? (
              <p>장바구니에 담긴 상품이 없습니다.</p>
            ) : (
              <ul className="role-list">
                {cart.map((item) => (
                  <li key={item.product.id}>
                    <span>{item.product.name}</span>
                    <strong>{item.quantity}개</strong>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={onOpenShop}>
              장바구니 확인
            </button>
          </section>

          <section className="role-panel">
            <h2>찜한 상품</h2>
            {wishlist.length === 0 ? (
              <p>찜한 상품이 없습니다.</p>
            ) : (
              <ul className="role-list">
                {wishlist.map((product) => (
                  <li key={product.id}>
                    <span>{product.name}</span>
                    <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="role-panel">
          <h2>주문 내역</h2>
          {isOrderLoading && <p>주문 내역을 불러오고 있습니다.</p>}
          {orderMessage && <p className="payment-message">{orderMessage}</p>}
          {!isOrderLoading && !orderMessage && orders.length === 0 && <p>주문 내역이 없습니다.</p>}
          {!isOrderLoading && !orderMessage && orders.length > 0 && (
            <ul className="role-list order-history-list">
              {orders.map((order) => (
                <li key={order.orderId}>
                  <span>
                    {order.orderNumber}
                    <em>{order.status === 'PAID' ? '결제 완료' : order.status}</em>
                  </span>
                  <strong>{order.totalPrice.toLocaleString()}원</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

function SettingsPage({
  accountRole,
  isLoggedIn,
  onBack,
  onLogout,
}: {
  accountRole: UserRole
  isLoggedIn: boolean
  onBack: () => void
  onLogout: () => void
}) {
  const [orderNotice, setOrderNotice] = useState(true)
  const [marketingNotice, setMarketingNotice] = useState(false)

  return (
    <main className="storefront">
      <section className="role-page">
        <div className="role-page-heading">
          <div>
            <span>settings</span>
            <h1>설정</h1>
            <p>계정 상태와 알림 수신 여부를 관리합니다.</p>
          </div>
          <button type="button" onClick={onBack}>
            돌아가기
          </button>
        </div>

        <section className="role-panel">
          <h2>계정</h2>
          <dl className="settings-list">
            <div>
              <dt>로그인 상태</dt>
              <dd>{isLoggedIn ? '로그인됨' : '로그인 필요'}</dd>
            </div>
            <div>
              <dt>권한</dt>
              <dd>{accountRole}</dd>
            </div>
            <div>
              <dt>API 서버</dt>
              <dd>{API_BASE_URL}</dd>
            </div>
          </dl>
        </section>

        <section className="role-panel">
          <h2>알림</h2>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={orderNotice}
              onChange={(event) => setOrderNotice(event.target.checked)}
            />
            주문 및 배송 알림 받기
          </label>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={marketingNotice}
              onChange={(event) => setMarketingNotice(event.target.checked)}
            />
            이벤트와 추천 상품 알림 받기
          </label>
        </section>

        {isLoggedIn && (
          <section className="role-panel">
            <h2>로그인 관리</h2>
            <button type="button" onClick={onLogout}>
              로그아웃
            </button>
          </section>
        )}
      </section>
    </main>
  )
}

function PaymentResultPage({
  paymentResult,
  paymentMessage,
  onBack,
}: {
  paymentResult: PaymentResponse | null
  paymentMessage: string
  onBack: () => void
}) {
  const isSuccess = Boolean(paymentResult)

  return (
    <main className="storefront">
      <section className="role-page">
        <div className="role-page-heading">
          <div>
            <span>payment result</span>
            <h1>{isSuccess ? '결제 완료' : '결제 확인'}</h1>
            <p>{paymentMessage || '결제 결과를 확인하고 있습니다.'}</p>
          </div>
          <button type="button" onClick={onBack}>
            쇼핑 계속하기
          </button>
        </div>

        {paymentResult && (
          <section className="role-panel">
            <h2>결제 정보</h2>
            <dl className="settings-list">
              <div>
                <dt>주문번호</dt>
                <dd>{paymentResult.tossOrderId}</dd>
              </div>
              <div>
                <dt>주문명</dt>
                <dd>{paymentResult.orderName}</dd>
              </div>
              <div>
                <dt>결제수단</dt>
                <dd>{paymentResult.method}</dd>
              </div>
              <div>
                <dt>결제상태</dt>
                <dd>{paymentResult.status}</dd>
              </div>
              <div>
                <dt>결제금액</dt>
                <dd>{paymentResult.totalAmount.toLocaleString()}원</dd>
              </div>
            </dl>
            {paymentResult.receiptUrl && (
              <a className="receipt-link" href={paymentResult.receiptUrl} target="_blank" rel="noreferrer">
                영수증 보기
              </a>
            )}
          </section>
        )}
      </section>
    </main>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')))
  const [accountLoginId, setAccountLoginId] = useState(() => localStorage.getItem('accountLoginId') ?? '')
  const [accountRole, setAccountRole] = useState<UserRole>(
    () => (localStorage.getItem('accountRole') as UserRole | null) ?? 'USER',
  )
  const [view, setView] = useState<View>(() =>
    localStorage.getItem('accountRole') === 'ADMIN' && localStorage.getItem('accessToken') ? 'admin' : 'home',
  )
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: '',
    email: '',
    loginId: '',
    password: '',
    passwordConfirm: '',
    role: 'USER',
    address: '',
    addressDetail: '',
    phone: '',
  })
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [productMessage, setProductMessage] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product>(fallbackProducts[0])
  const [selectedImage, setSelectedImage] = useState(fallbackProducts[0].images[0])
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Product[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)

  const filteredProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    const categoryProducts =
      activeCategory === 'all'
        ? products
        : activeCategory === 'sale'
          ? products.filter((product) => product.salePrice)
          : products.filter((product) => product.category === activeCategory)

    return categoryProducts.filter((product) => matchesProductKeyword(product, keyword))
  }, [activeCategory, products, searchKeyword])

  const cartTotal = cart.reduce(
    (sum, item) => sum + (item.product.salePrice ?? item.product.price) * item.quantity,
    0,
  )

  const homeSearchProducts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) return products

    return products.filter((product) =>
      [product.name, product.shortInfo, product.detail, product.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    )
  }, [products, searchKeyword])

  const newProducts = products.slice(0, 3)
  const saleProducts = products.filter((product) => product.salePrice)
  const carouselProducts = saleProducts.length > 0 ? saleProducts : products
  const carouselProduct = carouselProducts[carouselIndex % carouselProducts.length]

  const refreshProducts = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`${API_BASE_URL}/products`, { signal })
    if (!response.ok) {
      throw new Error(await readApiResponseMessage(response))
    }

    const data = (await response.json()) as ProductApiResponse[]
    const nextProducts = data.map(toStorefrontProduct)

    if (nextProducts.length > 0) {
      setProducts(nextProducts)
      setSelectedProduct((current) => nextProducts.find((product) => product.id === current.id) ?? nextProducts[0])
      setSelectedImage((currentImage) => {
        const currentProduct = nextProducts.find((product) => product.images.includes(currentImage))
        return currentProduct ? currentImage : nextProducts[0].images[0]
      })
      setProductMessage('')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      refreshProducts(controller.signal)
        .catch((error) => {
          if (isAbortError(error)) return
          setProductMessage(
            error instanceof Error
              ? `상품 API 연결 실패: ${error.message}. 기본 상품으로 표시합니다.`
              : '상품 API 연결 실패로 기본 상품을 표시합니다.',
          )
        })
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [refreshProducts])

  useEffect(() => {
    if (carouselProducts.length === 0) return undefined

    const timer = window.setInterval(() => {
      setCarouselIndex((index) => (index + 1) % carouselProducts.length)
    }, 3500)

    return () => window.clearInterval(timer)
  }, [carouselProducts.length])

  function selectProduct(product: Product) {
    setSelectedProduct(product)
    setSelectedImage(product.images[0])
    setQuantity(1)
    setView('shop')
  }

  function selectCategory(category: Category) {
    setActiveCategory(category)
    setView('shop')
    const nextProducts =
      category === 'all'
        ? products
        : category === 'sale'
          ? products.filter((product) => product.salePrice)
          : products.filter((product) => product.category === category)

    if (nextProducts[0]) selectProduct(nextProducts[0])
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActiveCategory('all')
    setView('shop')
  }

  function openLogin() {
    setAuthMode('login')
    setAuthMessage('')
    setView('auth')
  }

  function openRolePage() {
    if (!isLoggedIn) {
      openLogin()
      return
    }

    if (accountRole === 'ADMIN') {
      setView('admin')
      return
    }

    if (accountRole === 'SELLER') {
      setView('seller')
      return
    }

    setView('mypage')
  }

  function logout() {
    clearStoredAuth()
    setIsLoggedIn(false)
    setAccountLoginId('')
    setAccountRole('USER')
    setCart([])
    setWishlist([])
    setPaymentMessage('')
    setAuthMessage('')
    setView('home')
  }

  useEffect(() => {
    function handleAuthExpired() {
      setIsLoggedIn(false)
      setAccountLoginId('')
      setAccountRole('USER')
      setCart([])
      setWishlist([])
      setPaymentMessage('')
      setAuthMessage('로그인이 만료되었습니다. 다시 로그인해주세요.')
      setView('auth')
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [])

  function changeSignupField(field: keyof SignupForm, value: string) {
    setSignupForm((form) => ({ ...form, [field]: value }))
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMessage('')

    if (signupForm.password !== signupForm.passwordConfirm) {
      setAuthMessage('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (!phoneVerified) {
      setAuthMessage('전화번호 인증을 먼저 완료해주세요.')
      return
    }

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: signupForm.name,
        email: signupForm.email,
        loginId: signupForm.loginId,
        password: signupForm.password,
        role: signupForm.role,
        address: signupForm.address,
        addressDetail: signupForm.addressDetail,
        phone: signupForm.phone,
      }),
    })

    if (!response.ok) {
      setAuthMessage(await readApiResponseMessage(response))
      return
    }

    window.alert('회원가입이 완료되었습니다.')
    setAuthMessage('회원가입이 완료되었습니다. 로그인해주세요.')
    setLoginId(signupForm.loginId || signupForm.email)
    setAuthMode('login')
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthMessage('')

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId,
        password: loginPassword,
      }),
    })

    if (!response.ok) {
      setAuthMessage(await readApiResponseMessage(response))
      return
    }

    const data = await response.json()
    const accessToken = data.accessToken ?? data.token
    const role = (data.role ?? 'USER') as UserRole

    if (!accessToken) {
      setAuthMessage('로그인은 성공했지만 토큰 응답값을 찾지 못했습니다.')
      return
    }

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('accountRole', role)
    localStorage.setItem('accountLoginId', data.loginId ?? loginId)
    setIsLoggedIn(true)
    setAccountLoginId(data.loginId ?? loginId)
    setAccountRole(role)
    setCart([])
    setWishlist([])
    setPaymentMessage('')
    setLoginPassword('')
    setAuthMessage('')
    setView(role === 'ADMIN' ? 'admin' : 'home')
  }

  function toggleWishlist(product: Product) {
    setWishlist((items) => {
      if (items.some((item) => item.id === product.id)) {
        return items.filter((item) => item.id !== product.id)
      }

      return [...items, product]
    })
  }

  async function addToCart(product: Product) {
    setCart((items) => {
      const exists = items.find((item) => item.product.id === product.id)
      if (exists) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...items, { product, quantity }]
    })

    if (!isLoggedIn) return

    try {
      await authFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      })
      setPaymentMessage('')
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : '서버 장바구니 저장에 실패했습니다.')
    }
  }

  async function removeCartProduct(productId: number) {
    setCart((items) => items.filter((item) => item.product.id !== productId))
    setPaymentMessage('')

    if (!isLoggedIn) return

    try {
      const serverCart = await authFetch<CartItemApiResponse[]>('/cart')
      const serverItem = serverCart.find((item) => item.productId === productId)
      if (serverItem) {
        await authFetch(`/cart/${serverItem.cartItemId}`, { method: 'DELETE' })
      }
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : '장바구니 상품 삭제에 실패했습니다.')
    }
  }

  function updateCartQuantity(productId: number, nextQuantity: number) {
    if (nextQuantity <= 0) {
      void removeCartProduct(productId)
      return
    }

    setCart((items) =>
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity: nextQuantity } : item,
      ),
    )
  }

  const productPrice = selectedProduct.salePrice ?? selectedProduct.price
  const productTotal = productPrice * quantity

  async function startCartPayment() {
    if (!isLoggedIn) {
      openLogin()
      return
    }

    if (!TOSS_CLIENT_KEY) {
      setPaymentMessage('Toss 클라이언트 키가 설정되지 않았습니다.')
      return
    }

    if (cart.length === 0) {
      setPaymentMessage('장바구니에 담긴 상품이 없습니다.')
      return
    }

    setIsPaymentLoading(true)
    setPaymentMessage('')

    try {
      let serverCart = await authFetch<CartItemApiResponse[]>('/cart')

      if (serverCart.length === 0) {
        await Promise.all(
          cart.map((item) =>
            authFetch('/cart', {
              method: 'POST',
              body: JSON.stringify({
                productId: item.product.id,
                quantity: item.quantity,
              }),
            }),
          ),
        )
        serverCart = await authFetch<CartItemApiResponse[]>('/cart')
      }

      if (serverCart.length === 0) {
        throw new Error('서버 장바구니가 비어 있습니다. 상품을 다시 담아주세요.')
      }

      const checkout = await authFetch<OrderCheckoutResponse>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          cartItemIds: serverCart.map((item) => item.cartItemId),
          name: accountLoginId || '구매자',
          phone: '010-0000-0000',
          address: '테스트 배송지',
        }),
      })

      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY)
      const payment = tossPayments.payment({ customerKey: accountLoginId || ANONYMOUS })

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: checkout.amount,
        },
        orderId: checkout.orderId,
        orderName: checkout.orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerName: accountLoginId || '구매자',
        card: {
          flowMode: 'DEFAULT',
          useEscrow: false,
        },
      })
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : '결제 요청에 실패했습니다.')
    } finally {
      setIsPaymentLoading(false)
    }
  }

  async function confirmPayment(paymentKey: string, orderId: string, amount: number) {
    setIsPaymentLoading(true)
    setPaymentMessage('결제 승인 중입니다.')
    setView('payment-result')

    try {
      const result = await authFetch<PaymentResponse>('/payments/confirm', {
        method: 'POST',
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount,
        }),
      })

      setPaymentResult(result)
      setCart([])
      setPaymentMessage('결제가 완료되었습니다.')
      window.history.replaceState({}, '', '/')
    } catch (error) {
      setPaymentResult(null)
      setPaymentMessage(error instanceof Error ? error.message : '결제 승인에 실패했습니다.')
    } finally {
      setIsPaymentLoading(false)
    }
  }

  useEffect(() => {
    const pathname = window.location.pathname
    const params = new URLSearchParams(window.location.search)
    const paymentKey = params.get('paymentKey')
    const orderId = params.get('orderId')
    const amount = params.get('amount')
    const failCode = params.get('code')
    const failMessage = params.get('message')

    const timeoutId = window.setTimeout(() => {
      if (pathname === '/payment/success' && paymentKey && orderId && amount) {
        confirmPayment(paymentKey, orderId, Number(amount))
        return
      }

      if (pathname === '/payment/fail' || failCode || failMessage) {
        setPaymentResult(null)
        setPaymentMessage(`결제가 취소되었거나 실패했습니다. ${failMessage ?? failCode ?? ''}`)
        setView('payment-result')
        window.history.replaceState({}, '', '/')
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  if (view === 'admin') {
    return <AdminDashboard onLogout={logout} onOpenUserView={() => setView('home')} />
  }

  if (view === 'seller') {
    return <SellerCenterPage onBack={() => setView('home')} onProductsChanged={() => refreshProducts()} />
  }

  if (view === 'mypage') {
    return (
      <MyPage
        cart={cart}
        wishlist={wishlist}
        cartTotal={cartTotal}
        onBack={() => setView('home')}
        onOpenShop={() => setView('shop')}
      />
    )
  }

  if (view === 'settings') {
    return (
      <SettingsPage
        accountRole={accountRole}
        isLoggedIn={isLoggedIn}
        onBack={() => setView('home')}
        onLogout={logout}
      />
    )
  }

  if (view === 'payment-result') {
    return (
      <PaymentResultPage
        paymentResult={paymentResult}
        paymentMessage={isPaymentLoading ? '결제 승인 중입니다.' : paymentMessage}
        onBack={() => setView('home')}
      />
    )
  }

  return (
    <main className="storefront">
      <header className="site-header">
        <div className="shop-menu">
          <button type="button" className="shop-trigger">
            shop
          </button>
          <div className="shop-dropdown">
            <button type="button" onClick={() => selectCategory('plants')}>
              다육식물
            </button>
            <button type="button" onClick={() => selectCategory('pots')}>
              화분
            </button>
            <button type="button" onClick={() => selectCategory('tools')}>
              보조도구
            </button>
          </div>
        </div>

        <button type="button" className="brand-title" onClick={() => setView('home')}>
          flower garden
        </button>

        <nav className="member-nav" aria-label="회원 메뉴">
          <button type="button" onClick={isLoggedIn ? logout : openLogin}>
            {isLoggedIn ? '로그아웃' : '로그인'}
          </button>
          <button type="button" onClick={openRolePage}>
            {accountRole === 'ADMIN' ? '관리자' : accountRole === 'SELLER' ? '판매자' : '사용자'}
          </button>
          <a href="#cart" onClick={() => setView('shop')}>
            장바구니 {cart.length > 0 && <span>{cart.length}</span>}
          </a>
          <button type="button" onClick={() => setView('settings')}>
            설정
          </button>
        </nav>
      </header>

      {view === 'auth' ? (
        <section className="auth-screen">
          <div className="auth-panel">
            <div className="auth-heading">
              <span>flower garden account</span>
              <h1>{authMode === 'login' ? '로그인' : '회원가입'}</h1>
              <p>
                {authMode === 'login'
                  ? '아이디와 비밀번호를 입력하면 서버에서 회원 정보를 확인하고 토큰을 발급합니다.'
                  : '첫 방문이신가요? 회원 정보를 입력하고 꽃동산 다육을 시작해보세요.'}
              </p>
            </div>

            <div className="auth-tabs" role="tablist" aria-label="로그인 회원가입 선택">
              <button
                type="button"
                className={authMode === 'login' ? 'is-active' : ''}
                onClick={() => {
                  setAuthMode('login')
                  setAuthMessage('')
                }}
              >
                로그인
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'is-active' : ''}
                onClick={() => {
                  setAuthMode('signup')
                  setAuthMessage('')
                }}
              >
                회원가입
              </button>
            </div>

            {authMode === 'login' ? (
              <form className="auth-form" onSubmit={submitLogin}>
                <label>
                  아이디
                  <input
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    placeholder="이메일을 입력하세요"
                    autoComplete="username"
                    required
                  />
                </label>
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                    required
                  />
                </label>
                {authMessage && <p className="auth-message">{authMessage}</p>}
                <button type="submit" className="auth-submit">
                  로그인
                </button>
                <p className="auth-switch">
                  첫 방문이신가요?
                  <button type="button" onClick={() => setAuthMode('signup')}>
                    회원가입
                  </button>
                </p>
              </form>
            ) : (
              <form className="auth-form" onSubmit={submitSignup}>
                <label>
                  이름
                  <input
                    value={signupForm.name}
                    onChange={(event) => changeSignupField('name', event.target.value)}
                    placeholder="이름을 입력하세요"
                    required
                  />
                </label>
                <label>
                  이메일
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => changeSignupField('email', event.target.value)}
                    placeholder="email@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  아이디
                  <input
                    value={signupForm.loginId}
                    onChange={(event) => changeSignupField('loginId', event.target.value)}
                    placeholder="사용할 아이디"
                    autoComplete="username"
                    required
                  />
                </label>
                <fieldset className="role-select">
                  <legend>회원 유형</legend>
                  <label>
                    <input
                      type="radio"
                      name="signupRole"
                      value="USER"
                      checked={signupForm.role === 'USER'}
                      onChange={() => changeSignupField('role', 'USER')}
                    />
                    구매자
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="signupRole"
                      value="SELLER"
                      checked={signupForm.role === 'SELLER'}
                      onChange={() => changeSignupField('role', 'SELLER')}
                    />
                    판매자
                  </label>
                </fieldset>
                <div className="auth-grid">
                  <label>
                    비밀번호
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(event) => changeSignupField('password', event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    비밀번호확인
                    <input
                      type="password"
                      value={signupForm.passwordConfirm}
                      onChange={(event) => changeSignupField('passwordConfirm', event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>
                <div className="address-row">
                  <label>
                    주소
                    <input
                      value={signupForm.address}
                      onChange={(event) => changeSignupField('address', event.target.value)}
                      placeholder="기본 주소"
                      required
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => window.alert('주소 검색은 다음 단계에서 실제 주소 API와 연결할 수 있습니다.')}
                  >
                    주소검색
                  </button>
                </div>
                <label>
                  세부 주소
                  <input
                    value={signupForm.addressDetail}
                    onChange={(event) => changeSignupField('addressDetail', event.target.value)}
                    placeholder="동, 호수 등 상세 주소"
                    required
                  />
                </label>
                <div className="address-row">
                  <label>
                    전화번호
                    <input
                      value={signupForm.phone}
                      onChange={(event) => {
                        changeSignupField('phone', event.target.value)
                        setPhoneVerified(false)
                      }}
                      placeholder="010-0000-0000"
                      autoComplete="tel"
                      required
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneVerified(true)
                      window.alert('전화번호 인증이 완료되었습니다.')
                    }}
                  >
                    전화번호 인증하기
                  </button>
                </div>
                {phoneVerified && <p className="auth-success">인증완료되었습니다.</p>}
                {authMessage && <p className="auth-message">{authMessage}</p>}
                <button type="submit" className="auth-submit">
                  회원가입완료
                </button>
              </form>
            )}
          </div>
        </section>
      ) : view === 'home' ? (
        <>
          <section className="home-hero">
            <div className="home-hero-copy">
              <span>꽃동산 다육</span>
              <h1>오늘 도착한 작은 정원</h1>
              <p>신상 입고와 특가 다육이를 검색하고, 마음에 드는 식물을 바로 담아보세요.</p>
              <form className="home-search" onSubmit={submitSearch}>
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="다육식물 이름이나 특징을 검색하세요"
                />
                <button type="submit">검색</button>
              </form>
            </div>

            <button type="button" className="carousel-card" onClick={() => selectProduct(carouselProduct)}>
              <img src={carouselProduct.images[0]} alt={carouselProduct.name} />
              <div>
                <span>{carouselProduct.salePrice ? '특가 다육이' : '추천 다육이'}</span>
                <h2>{carouselProduct.name}</h2>
                <p>{carouselProduct.shortInfo}</p>
                <strong>{(carouselProduct.salePrice ?? carouselProduct.price).toLocaleString()}원</strong>
              </div>
              <div className="carousel-dots">
                {carouselProducts.map((product, index) => (
                  <span key={product.id} className={index === carouselIndex ? 'is-active' : ''} />
                ))}
              </div>
            </button>
          </section>

          <section className="home-section">
            <div className="section-title-row">
              <div>
                <span>new arrival</span>
                <h2>신상 입고</h2>
              </div>
              <button type="button" onClick={() => selectCategory('all')}>
                전체 상품 보기
              </button>
            </div>
            <div className="home-product-grid">
              {newProducts.map((product) => (
                <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                  <img src={product.images[0]} alt={product.name} />
                  <span>{product.name}</span>
                  <strong>{product.price.toLocaleString()}원</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="home-section sale-section">
            <div className="section-title-row">
              <div>
                <span>special price</span>
                <h2>특가 다육이</h2>
              </div>
              <button type="button" onClick={() => selectCategory('sale')}>
                세일 카테고리
              </button>
            </div>
            <div className="home-product-grid">
              {saleProducts.map((product) => (
                <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                  <img src={product.images[0]} alt={product.name} />
                  <span>{product.name}</span>
                  <del>{product.price.toLocaleString()}원</del>
                  <strong>{product.salePrice?.toLocaleString()}원</strong>
                </button>
              ))}
            </div>
          </section>

          {searchKeyword && (
            <section className="home-section">
              <div className="section-title-row">
                <div>
                  <span>search result</span>
                  <h2>검색 결과</h2>
                </div>
              </div>
              {homeSearchProducts.length === 0 ? (
                <p className="empty-message">검색어와 일치하는 상품이 없습니다.</p>
              ) : (
                <div className="home-product-grid">
                  {homeSearchProducts.map((product) => (
                    <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                      <img src={product.images[0]} alt={product.name} />
                      <span>{product.name}</span>
                      <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="shop-hero">
            <div>
              <span>꽃동산 다육</span>
              <h1>작은 화분 안에 담은 조용한 정원</h1>
              <p>다육식물, 화분, 보조도구를 한 곳에서 고르고 장바구니에 담아보세요.</p>
            </div>
          </section>

      <section className="category-band" aria-label="다육식물 카테고리">
        <div>
          <h2>{categoryLabels[activeCategory]}</h2>
          <p>다육식물, 화분, 보조도구를 그리드로 확인하고 검색어로 이름과 특징을 좁혀볼 수 있습니다.</p>
          {productMessage && <p className="product-message">{productMessage}</p>}
        </div>
        <div className="category-buttons">
          {(Object.keys(categoryLabels) as Category[]).map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'is-active' : ''}
              onClick={() => selectCategory(category)}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>
      </section>

      <section className="product-browser">
        <aside className="product-list" aria-label="상품 목록">
          {filteredProducts.length === 0 ? (
            <p className="empty-message">조건에 맞는 상품이 없습니다.</p>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className={selectedProduct.id === product.id ? 'product-tile is-selected' : 'product-tile'}
                onClick={() => selectProduct(product)}
              >
                <img src={product.images[0]} alt={product.name} />
                <span>{product.name}</span>
                <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                {product.salePrice && <em>특가</em>}
              </button>
            ))
          )}
        </aside>

        <section className="product-detail" aria-label="상품 상세">
          <div className="gallery">
            <div className="main-image">
              <img src={selectedImage} alt={selectedProduct.name} />
            </div>
            <div className="thumb-row">
              {selectedProduct.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={selectedImage === image ? 'is-active' : ''}
                  onClick={() => setSelectedImage(image)}
                >
                  <img src={image} alt={`${selectedProduct.name} 상세 사진`} />
                </button>
              ))}
            </div>
          </div>

          <div className="purchase-panel">
            <div className="product-heading">
              <p>{categoryLabels[selectedProduct.category]}</p>
              <h2>{selectedProduct.name}</h2>
              <strong>{productPrice.toLocaleString()}원</strong>
              {selectedProduct.salePrice && <del>{selectedProduct.price.toLocaleString()}원</del>}
            </div>

            <dl className="info-list">
              <div>
                <dt>세부정보</dt>
                <dd>{selectedProduct.detail}</dd>
              </div>
              <div>
                <dt>배송비</dt>
                <dd>{selectedProduct.deliveryFee.toLocaleString()}원</dd>
              </div>
              <div>
                <dt>특징</dt>
                <dd>{selectedProduct.tags.join(' · ')}</dd>
              </div>
            </dl>

            <label className="quantity-control">
              갯수
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              />
            </label>

            <div className="order-summary">
              <div>
                <span>주문수량</span>
                <strong>{quantity}개</strong>
              </div>
              <div>
                <span>총 상품금액</span>
                <strong>{productTotal.toLocaleString()}원</strong>
              </div>
            </div>

            <div className="purchase-actions">
              <button type="button" className="primary-action">
                구매하기
              </button>
              <button type="button" onClick={() => addToCart(selectedProduct)}>
                장바구니에 담기
              </button>
              <button type="button" onClick={() => toggleWishlist(selectedProduct)}>
                {wishlist.some((product) => product.id === selectedProduct.id) ? '찜 해제' : '찜하기'}
              </button>
            </div>
          </div>
        </section>
      </section>

      <section id="cart" className="cart-section">
        <div className="section-heading">
          <h2>장바구니</h2>
          <p>상품을 장바구니에 추가하면 이곳에서 확인할 수 있습니다.</p>
        </div>

        {cart.length === 0 ? (
          <p className="empty-message">아직 장바구니에 담긴 상품이 없습니다.</p>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {cart.map((item) => (
                <article key={item.product.id} className="cart-item">
                  <img src={item.product.images[0]} alt={item.product.name} />
                  <div>
                    <h3>{item.product.name}</h3>
                    <p>{item.product.shortInfo}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(event) =>
                      updateCartQuantity(item.product.id, Number(event.target.value))
                    }
                  />
                  <strong>
                    {((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString()}원
                  </strong>
                  <button
                    type="button"
                    className="cart-remove-button"
                    aria-label={`${item.product.name} 장바구니에서 삭제`}
                    onClick={() => removeCartProduct(item.product.id)}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
            <aside className="cart-total">
              <span>총 결제 예정 금액</span>
              <strong>{cartTotal.toLocaleString()}원</strong>
              {paymentMessage && <p className="payment-message">{paymentMessage}</p>}
              <button type="button" onClick={startCartPayment} disabled={isPaymentLoading}>
                {isPaymentLoading ? '결제창 여는 중' : 'Toss 테스트 결제하기'}
              </button>
            </aside>
          </div>
        )}
      </section>
        </>
      )}

      <a className="kakao-talk" href="https://pf.kakao.com/" target="_blank" rel="noreferrer">
        카카오톡 톡문의
      </a>

      <footer className="site-footer">
        <div className="footer-actions">
          <button type="button">유튜브 채널</button>
          <button type="button">제품구매</button>
        </div>
        <p>상호: 꽃동산 다육 | 대표: 이용숙 | 개인정보 관리책임자: 이용숙 | 전화: 010-3939-4304 | 이메일</p>
        <p>주소: 덕수천1로 37 | 사업자등록번호 | 통신판매</p>
      </footer>
    </main>
  )
}

export default App

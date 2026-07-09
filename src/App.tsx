import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './App.css'

type Category = 'all' | 'echeveria' | 'haworthia' | 'lithops' | 'sale'
type View = 'home' | 'shop' | 'auth' | 'admin'
type AuthMode = 'login' | 'signup'
type UserRole = 'USER' | 'SELLER' | 'ADMIN'
type AdminSectionId = 'orders' | 'boards' | 'members' | 'main-products' | 'banners' | 'products' | 'statistics' | 'policies' | 'audit'

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

type CartItem = {
  product: Product
  quantity: number
}

type SignupForm = {
  name: string
  email: string
  loginId: string
  password: string
  passwordConfirm: string
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

type AdminBanner = {
  id: number
  title: string
  imageUrl: string
  linkUrl: string
  visible: boolean
  sortOrder: number
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

type AdminAuditLog = {
  id: number
  adminLoginId: string
  action: string
  targetType: string
  targetId: number
  description: string
  createdAt: string | null
}

type AdminPage<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

const products: Product[] = [
  {
    id: 1,
    name: '방울복랑금',
    category: 'echeveria',
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
    category: 'echeveria',
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
    category: 'haworthia',
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
    category: 'lithops',
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
    category: 'echeveria',
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
]

const categoryLabels: Record<Category, string> = {
  all: '전체',
  echeveria: '에케베리아',
  haworthia: '하월시아',
  lithops: '리톱스',
  sale: '세일',
}

const adminMenus: AdminMenu[] = [
  { id: 'orders', label: '주문 관리' },
  { id: 'boards', label: '게시판 관리' },
  { id: 'members', label: '회원 관리' },
  { id: 'main-products', label: '메인 상품 관리' },
  { id: 'banners', label: '배너 관리' },
  { id: 'products', label: '상품 관리' },
  { id: 'statistics', label: '통계' },
  { id: 'policies', label: '기본 정책 관리' },
  { id: 'audit', label: '감사 로그' },
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

async function adminFetch<T>(path: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('accessToken')
  const headers = new Headers(options.headers)

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(await readApiResponseMessage(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
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
      const accessToken = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        signal,
      })

      if (!response.ok) {
        throw new Error(await readApiResponseMessage(response))
      }

      setDashboard((await response.json()) as AdminDashboardResponse)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
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
          <button type="button" onClick={() => window.alert('사내 게시판은 다음 단계에서 연결합니다.')}>
            사내 게시판
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
  const [banners, setBanners] = useState<AdminBanner[]>([])
  const [policies, setPolicies] = useState<AdminPolicy[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [settlements, setSettlements] = useState<AdminSettlement[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
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

      if (section === 'main-products' || section === 'products') {
        const [nextProducts, nextReports] = await Promise.all([
          adminFetch<AdminPage<AdminProduct>>(`/admin/products?${buildAdminQuery()}`),
          adminFetch<AdminPage<AdminReport>>('/admin/reports?page=0&size=10'),
        ])
        applyPage(nextProducts, setAdminProducts)
        setReports(nextReports.items)
      }

      if (section === 'banners') {
        applyPage(
          await adminFetch<AdminPage<AdminBanner>>(
            `/admin/banners?${buildAdminQuery(filterStatus ? { visible: filterStatus } : {}, false)}`,
          ),
          setBanners,
        )
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
        applyPage(await adminFetch<AdminPage<AdminPolicy>>(`/admin/policies?${buildAdminQuery()}`), setPolicies)
      }

      if (section === 'audit') {
        applyPage(await adminFetch<AdminPage<AdminAuditLog>>(`/admin/audit-logs?${buildAdminQuery()}`), setAuditLogs)
      }
    } catch (error) {
      setSectionMessage(error instanceof Error ? error.message : '관리자 메뉴 정보를 불러오지 못했습니다.')
    } finally {
      setIsSectionLoading(false)
    }
  }, [buildAdminQuery, filterStatus, section])

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

  async function createBanner() {
    const title = askRequired('배너 제목을 입력하세요.')
    if (!title) return
    const imageUrl = askRequired('배너 이미지 URL을 입력하세요.', 'https://example.com/banner.jpg')
    if (!imageUrl) return
    const linkUrl = askRequired('배너 링크 URL을 입력하세요.', '/')
    if (!linkUrl) return

    await runAdminAction(
      () => adminFetch('/admin/banners', {
        method: 'POST',
        body: JSON.stringify({ title, imageUrl, linkUrl, visible: true, sortOrder: banners.length + 1 }),
      }),
      '배너를 등록했습니다.',
    )
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
    if (section === 'main-products' || section === 'products') return ['ON_SALE', 'SOLD_OUT', 'HIDDEN']
    if (section === 'banners') return ['true', 'false']
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
    'main-products': [
      { title: '오늘 등록 상품', value: `${dashboard.todayStatus.productCreatedCount.toLocaleString()}건`, description: '오늘 신규 등록된 상품' },
      { title: '판매 중지 상품', value: `${dashboard.marketplaceStatus.suspendedProductCount.toLocaleString()}개`, description: '숨김 또는 판매 중지 상태의 상품' },
      { title: '신고된 상품', value: `${dashboard.marketplaceStatus.reportedProductCount.toLocaleString()}건`, description: '운영 검수가 필요한 상품 신고' },
    ],
    banners: [
      { title: '메인 배너', value: '준비 중', description: '홈 화면 대표 배너 노출 관리' },
      { title: '이벤트 배너', value: '준비 중', description: '이벤트와 기획전 배너 관리' },
      { title: '노출 상태', value: '기본값', description: '배너 도메인 추가 후 실제 노출 상태 연동' },
    ],
    products: [
      { title: '전체 상품 관리', value: `${dashboard.todayStatus.productCreatedCount.toLocaleString()}건`, description: '상품 등록, 수정, 판매 상태 검수' },
      { title: '상품 문의', value: `${dashboard.pendingStatus.productInquiryCount.toLocaleString()}건`, description: '답변 대기 중인 상품 문의' },
      { title: '신고된 리뷰', value: `${dashboard.marketplaceStatus.reportedReviewCount.toLocaleString()}건`, description: '운영 검수가 필요한 리뷰 신고' },
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
    audit: [
      { title: '감사 로그', value: `${pageInfo.totalElements.toLocaleString()}건`, description: '관리자 상태 변경과 저장 작업 이력' },
      { title: '현재 페이지', value: `${page + 1}`, description: '감사 로그 페이지 위치' },
      { title: '검색어', value: filterKeyword || '전체', description: '관리자, 액션, 대상, 설명 기준 검색' },
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
                {section === 'banners' ? (status === 'true' ? '노출' : '숨김') : status}
              </option>
            ))}
          </select>
        )}
        {section === 'banners' && <button type="button" onClick={createBanner}>배너 등록</button>}
        {section === 'policies' && <button type="button" onClick={savePolicy}>정책 저장</button>}
        {section === 'boards' && <button type="button" onClick={createPost}>게시글 등록</button>}
        {(section === 'main-products' || section === 'products') && (
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

      {(section === 'main-products' || section === 'products') && (
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

      {section === 'banners' && (
        <AdminTable
          headers={['제목', '링크', '노출', '순서', '처리']}
          rows={banners.map((banner) => ({
            id: banner.id,
            cells: [banner.title, banner.linkUrl, banner.visible ? '노출' : '숨김', `${banner.sortOrder}`],
            actions: (
              <>
                <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/banners/${banner.id}`, {
                  method: 'PUT',
                  body: JSON.stringify({ ...banner, visible: !banner.visible }),
                }), '배너 노출 상태를 변경했습니다.')}>노출전환</button>
                <button type="button" onClick={() => runAdminAction(() => adminFetch(`/admin/banners/${banner.id}`, { method: 'DELETE' }), '배너를 삭제했습니다.')}>삭제</button>
              </>
            ),
          }))}
        />
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
          rows={policies.map((policy) => ({
            id: policy.id,
            cells: [policy.policyKey, policy.title, policy.content],
          }))}
        />
      )}

      {section === 'audit' && (
        <AdminTable
          headers={['관리자', '액션', '대상', '설명', '시각']}
          rows={auditLogs.map((log) => ({
            id: log.id,
            cells: [
              log.adminLoginId,
              log.action,
              `${log.targetType} #${log.targetId}`,
              log.description,
              log.createdAt ?? '-',
            ],
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')))
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
    address: '',
    addressDetail: '',
    phone: '',
  })
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0])
  const [selectedImage, setSelectedImage] = useState(products[0].images[0])
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [carouselIndex, setCarouselIndex] = useState(0)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products
    if (activeCategory === 'sale') return products.filter((product) => product.salePrice)
    return products.filter((product) => product.category === activeCategory)
  }, [activeCategory])

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
  }, [searchKeyword])

  const newProducts = products.slice(0, 3)
  const saleProducts = products.filter((product) => product.salePrice)
  const carouselProducts = saleProducts.length > 0 ? saleProducts : products
  const carouselProduct = carouselProducts[carouselIndex % carouselProducts.length]

  useEffect(() => {
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
  }

  function openLogin() {
    setAuthMode('login')
    setAuthMessage('')
    setView('auth')
  }

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('accountRole')
    setIsLoggedIn(false)
    setAccountRole('USER')
    setAuthMessage('')
    setView('home')
  }

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
    setIsLoggedIn(true)
    setAccountRole(role)
    setLoginPassword('')
    setAuthMessage('')
    setView(role === 'ADMIN' ? 'admin' : 'home')
  }

  function addToCart(product: Product) {
    setCart((items) => {
      const exists = items.find((item) => item.product.id === product.id)
      if (exists) {
        return items.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...items, { product, quantity }]
    })
  }

  function updateCartQuantity(productId: number, nextQuantity: number) {
    if (nextQuantity <= 0) {
      setCart((items) => items.filter((item) => item.product.id !== productId))
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

  if (view === 'admin') {
    return <AdminDashboard onLogout={logout} onOpenUserView={() => setView('home')} />
  }

  return (
    <main className="storefront">
      <header className="site-header">
        <div className="shop-menu">
          <button type="button" className="shop-trigger">
            shop
          </button>
          <div className="shop-dropdown">
            <button type="button" onClick={() => selectCategory('all')}>
              다육식물
            </button>
            <button type="button">화분</button>
            <button type="button">보조도구</button>
          </div>
        </div>

        <button type="button" className="brand-title" onClick={() => setView('home')}>
          flower garden
        </button>

        <nav className="member-nav" aria-label="회원 메뉴">
          <button type="button" onClick={isLoggedIn ? logout : openLogin}>
            {isLoggedIn ? '로그아웃' : '로그인'}
          </button>
          <button type="button">{accountRole === 'ADMIN' ? '관리자' : '내정보'}</button>
          <a href="#cart" onClick={() => setView('shop')}>
            장바구니 {cart.length > 0 && <span>{cart.length}</span>}
          </a>
          <button type="button">설정</button>
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
              <div className="home-product-grid">
                {homeSearchProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                    <img src={product.images[0]} alt={product.name} />
                    <span>{product.name}</span>
                    <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                  </button>
                ))}
              </div>
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
          <h2>다육식물</h2>
          <p>버튼을 누르면 해당 카테고리의 다육식물 정보가 표시됩니다.</p>
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
          {filteredProducts.map((product) => (
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
          ))}
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
              <button type="button" className="naver-pay">
                네이버 페이 구매
              </button>
              <button type="button" className="kakao-pay">
                카카오 페이 구매
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
                </article>
              ))}
            </div>
            <aside className="cart-total">
              <span>총 결제 예정 금액</span>
              <strong>{cartTotal.toLocaleString()}원</strong>
              <button type="button">장바구니 상품 주문하기</button>
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

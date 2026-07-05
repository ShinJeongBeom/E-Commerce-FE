import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Category = 'all' | 'echeveria' | 'haworthia' | 'lithops' | 'sale'
type View = 'home' | 'shop' | 'auth' | 'seller'
type AuthMode = 'login' | 'signup'
type UserRole = 'USER' | 'SELLER' | 'ADMIN'

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

type ProductResponse = {
  id: number
  name: string
  plantType: string | null
  careLevel: string | null
  lightRequirement: string | null
  wateringCycle: string | null
  imageUrl: string | null
  potIncluded: string | null
  description: string | null
  price: number
  stock: number
  status: string | null
}

type CartItem = {
  product: Product
  quantity: number
}

type SignupForm = {
  name: string
  email: string
  loginId: string
  role: Exclude<UserRole, 'ADMIN'>
  password: string
  passwordConfirm: string
  address: string
  addressDetail: string
  phone: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=900&q=80'

function toCategory(plantType: string | null): Product['category'] {
  const value = plantType?.toLowerCase() ?? ''

  if (value.includes('haworthia') || value.includes('하월')) return 'haworthia'
  if (value.includes('lithops') || value.includes('리톱')) return 'lithops'

  return 'echeveria'
}

function toProduct(response: ProductResponse): Product {
  const description = response.description?.trim() || '상품 상세 정보가 준비 중입니다.'
  const tags = [
    response.plantType,
    response.careLevel,
    response.lightRequirement,
    response.wateringCycle,
    response.potIncluded,
  ].filter((tag): tag is string => Boolean(tag))

  return {
    id: response.id,
    name: response.name,
    category: toCategory(response.plantType),
    price: response.price,
    deliveryFee: 3000,
    shortInfo: description,
    detail: description,
    tags,
    images: [response.imageUrl || DEFAULT_PRODUCT_IMAGE],
  }
}

async function readApiResponseMessage(response: Response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const data = await response.json()
    return data.message ?? data.error ?? '요청 처리에 실패했습니다.'
  }

  const text = await response.text()
  return text || '요청 처리에 실패했습니다.'
}

const categoryLabels: Record<Category, string> = {
  all: '전체',
  echeveria: '에케베리아',
  haworthia: '하월시아',
  lithops: '리톱스',
  sale: '세일',
}

const roleLabels: Record<Exclude<UserRole, 'ADMIN'>, string> = {
  USER: '구매자',
  SELLER: '판매자',
}

type SellerProfileResponse = {
  sellerProfileId: number
  storeName: string
  approvalStatus: 'PENDING' | 'APPROVED' | 'SUSPENDED'
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

type SellerMenu = 'dashboard' | 'products' | 'orders' | 'sales' | 'inquiries'

function SellerDashboard({ role, onLogout }: { role: UserRole; onLogout: () => void }) {
  const isAdmin = role === 'ADMIN'
  const [activeMenu, setActiveMenu] = useState<SellerMenu>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [dashboard, setDashboard] = useState<SellerDashboardResponse | null>(null)
  const [products, setProducts] = useState<SellerProductResponse[]>([])
  const [orders, setOrders] = useState<SellerOrderResponse[]>([])
  const [sales, setSales] = useState<SellerSalesResponse | null>(null)
  const [inquiries, setInquiries] = useState<SellerInquiryResponse[]>([])

  const sellerMenus: Array<{ id: SellerMenu; label: string }> = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'products', label: '상품관리' },
    { id: 'orders', label: '주문관리' },
    { id: 'sales', label: '매출관리' },
    { id: 'inquiries', label: '문의관리' },
  ]

  useEffect(() => {
    const controller = new AbortController()

    async function fetchSellerResource<T>(path: string): Promise<T> {
      const accessToken = localStorage.getItem('accessToken')

      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(await readApiResponseMessage(response))
      }

      return response.json() as Promise<T>
    }

    async function loadSellerCenter() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [dashboardData, productData, orderData, salesData, inquiryData] = await Promise.all([
          fetchSellerResource<SellerDashboardResponse>('/seller-center/dashboard'),
          fetchSellerResource<SellerProductResponse[]>('/seller-center/products'),
          fetchSellerResource<SellerOrderResponse[]>('/seller-center/orders'),
          fetchSellerResource<SellerSalesResponse>('/seller-center/sales'),
          fetchSellerResource<SellerInquiryResponse[]>('/seller-center/inquiries'),
        ])

        setDashboard(dashboardData)
        setProducts(productData)
        setOrders(orderData)
        setSales(salesData)
        setInquiries(inquiryData)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorMessage(error instanceof Error ? error.message : '판매자센터 정보를 불러오지 못했습니다.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadSellerCenter()

    return () => controller.abort()
  }, [])

  const profile = dashboard?.profile
  const isPending = profile?.approvalStatus === 'PENDING'
  const summaryCards = [
    { label: '입금대기', value: dashboard?.waitingPaymentCount ?? 0, helper: '신규 주문' },
    { label: '배송준비', value: dashboard?.preparingDeliveryCount ?? 0, helper: '배송 전' },
    { label: '취소요청', value: dashboard?.cancelledOrderCount ?? 0, helper: '반품 요청' },
    { label: '오늘정산', value: `${(dashboard?.todaySettlementAmount ?? 0).toLocaleString()}원`, helper: '정산 예정' },
  ]
  const salesStats = [
    { label: '오늘 매출', value: `${(sales?.todaySalesAmount ?? dashboard?.todaySalesAmount ?? 0).toLocaleString()}원` },
    { label: '이번 달 매출', value: `${(sales?.monthlySalesAmount ?? dashboard?.monthlySalesAmount ?? 0).toLocaleString()}원` },
    { label: '주문 건수', value: `${sales?.orderCount ?? dashboard?.orderCount ?? 0}건` },
    { label: '등록 상품', value: `${dashboard?.productCount ?? products.length}개` },
  ]

  return (
    <section className="seller-console">
      <aside className="seller-sidebar">
        <div className="seller-profile">
          <div className="seller-avatar">{isAdmin ? 'A' : 'S'}</div>
          <strong>{isAdmin ? '관리자 센터' : '판매자 센터'}</strong>
          <span>{profile?.storeName ?? 'flower garden'}</span>
        </div>
        <nav aria-label="판매자 메뉴">
          {sellerMenus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className={activeMenu === menu.id ? 'is-active' : ''}
              onClick={() => setActiveMenu(menu.id)}
            >
              {menu.label}
            </button>
          ))}
          {isAdmin && <button type="button">회원관리</button>}
        </nav>
        <button type="button" className="seller-logout" onClick={onLogout}>
          로그아웃
        </button>
      </aside>

      <section className="seller-main">
        <header className="seller-topbar">
          <div>
            <span>{isAdmin ? 'admin workspace' : 'seller workspace'}</span>
            <h1>{isAdmin ? '관리자 운영 현황' : '판매 현황'}</h1>
            {profile && <p className="seller-approval">승인상태: {profile.approvalStatus}</p>}
          </div>
          <button type="button">공지사항</button>
        </header>

        {isLoading && <div className="seller-panel">판매자센터 정보를 불러오고 있습니다.</div>}
        {errorMessage && <div className="seller-panel seller-error">{errorMessage}</div>}
        {!isLoading && !errorMessage && isPending && (
          <section className="seller-panel seller-pending">
            <h2>판매자 승인 대기 중입니다</h2>
            <p>관리자 승인 후 상품관리, 주문관리, 매출관리 기능을 사용할 수 있습니다.</p>
          </section>
        )}
        {!isLoading && !errorMessage && !isPending && (
          <>
        <section className="seller-summary-grid" aria-label="주문 처리 현황">
          {summaryCards.map((card) => (
            <article key={card.label} className="seller-summary-card">
              <span>{card.helper}</span>
              <strong>{card.value}</strong>
              <p>{card.label}</p>
            </article>
          ))}
        </section>

        {activeMenu === 'dashboard' && (
        <section className="seller-dashboard-grid">
          <article className="seller-panel seller-panel-wide">
            <div className="seller-panel-heading">
              <h2>매출 통계</h2>
              <div className="seller-tabs">
                <button type="button" className="is-active">금주</button>
                <button type="button">금월</button>
                <button type="button">금년</button>
              </div>
            </div>
            <div className="sales-line" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          </article>

          <article className="seller-panel">
            <h2>미답변 문의</h2>
            <div className="empty-seller-state">
              {inquiries.length === 0 ? '등록된 문의가 없습니다.' : `${inquiries.length}건의 문의가 있습니다.`}
            </div>
          </article>

          <article className="seller-panel">
            <h2>공지사항</h2>
            <ul className="notice-list">
              {(dashboard?.notices ?? []).map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </article>

          <article className="seller-panel seller-panel-wide">
            <h2>매출 요약</h2>
            <div className="sales-stat-grid">
              {salesStats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
        )}

        {activeMenu === 'products' && (
          <section className="seller-panel">
            <h2>상품관리</h2>
            <div className="seller-table">
              {products.map((product) => (
                <div key={product.id} className="seller-table-row">
                  <span>{product.name}</span>
                  <strong>{product.price.toLocaleString()}원</strong>
                  <em>재고 {product.stock}</em>
                  <small>{product.status}</small>
                </div>
              ))}
              {products.length === 0 && <div className="empty-seller-state">등록된 상품이 없습니다.</div>}
            </div>
          </section>
        )}

        {activeMenu === 'orders' && (
          <section className="seller-panel">
            <h2>주문관리</h2>
            <div className="seller-table">
              {orders.map((order) => (
                <div key={order.id} className="seller-table-row">
                  <span>{order.orderNumber}</span>
                  <strong>{order.totalPrice.toLocaleString()}원</strong>
                  <em>{order.receiverName}</em>
                  <small>{order.status}</small>
                </div>
              ))}
              {orders.length === 0 && <div className="empty-seller-state">주문 내역이 없습니다.</div>}
            </div>
          </section>
        )}

        {activeMenu === 'sales' && (
          <section className="seller-panel">
            <h2>매출관리</h2>
            <div className="sales-stat-grid">
              {salesStats.map((stat) => (
                <div key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
              <div>
                <span>평균 주문 금액</span>
                <strong>{(sales?.averageOrderAmount ?? 0).toLocaleString()}원</strong>
              </div>
            </div>
          </section>
        )}

        {activeMenu === 'inquiries' && (
          <section className="seller-panel">
            <h2>문의관리</h2>
            <div className="seller-table">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="seller-table-row">
                  <span>{inquiry.title}</span>
                  <small>{inquiry.status}</small>
                </div>
              ))}
              {inquiries.length === 0 && <div className="empty-seller-state">등록된 문의가 없습니다.</div>}
            </div>
          </section>
        )}
          </>
        )}
      </section>
    </section>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('accessToken')))
  const [accountRole, setAccountRole] = useState<UserRole>(
    () => (localStorage.getItem('accountRole') as UserRole | null) ?? 'USER',
  )
  const [view, setView] = useState<View>('home')
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [loginId, setLoginId] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupForm, setSignupForm] = useState<SignupForm>({
    name: '',
    email: '',
    loginId: '',
    role: 'USER',
    password: '',
    passwordConfirm: '',
    address: '',
    addressDetail: '',
    phone: '',
  })
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [isLoginIdAvailable, setIsLoginIdAvailable] = useState(false)
  const [isCheckingLoginId, setIsCheckingLoginId] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [loginIdCheckMessage, setLoginIdCheckMessage] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [isProductsLoading, setIsProductsLoading] = useState(true)
  const [productError, setProductError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [carouselIndex, setCarouselIndex] = useState(0)

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products
    if (activeCategory === 'sale') return products.filter((product) => product.salePrice)
    return products.filter((product) => product.category === activeCategory)
  }, [activeCategory, products])

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
  }, [searchKeyword, products])

  const newProducts = products.slice(0, 3)
  const saleProducts = products.filter((product) => product.salePrice)
  const carouselProducts = saleProducts.length > 0 ? saleProducts : products
  const carouselProduct =
    carouselProducts.length > 0 ? carouselProducts[carouselIndex % carouselProducts.length] : null

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      setIsProductsLoading(true)
      setProductError('')

      try {
        const response = await fetch(`${API_BASE_URL}/products`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        const data = (await response.json()) as ProductResponse[]
        const nextProducts = data
          .filter((product) => product.status !== 'HIDDEN')
          .map(toProduct)

        setProducts(nextProducts)
        setSelectedProduct((current) => {
          const selected = current
            ? nextProducts.find((product) => product.id === current.id)
            : nextProducts[0]
          setSelectedImage(selected?.images[0] ?? '')
          return selected ?? null
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return

        setProducts([])
        setSelectedProduct(null)
        setSelectedImage('')
        setProductError(
          error instanceof Error ? error.message : '상품 목록을 불러오지 못했습니다.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsProductsLoading(false)
        }
      }
    }

    loadProducts()

    return () => controller.abort()
  }, [])

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
    if (field === 'loginId') {
      setIsLoginIdAvailable(false)
      setLoginIdCheckMessage('')
    }

    setSignupForm((form) => ({ ...form, [field]: value }))
  }

  async function readResponseMessage(response: Response) {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      return data.message ?? data.error ?? '요청 처리에 실패했습니다.'
    }

    const text = await response.text()
    return text || '요청 처리에 실패했습니다.'
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

    if (!isLoginIdAvailable) {
      setAuthMessage('아이디 중복확인을 먼저 완료해주세요.')
      return
    }

    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: signupForm.name,
        email: signupForm.email,
        loginId: signupForm.loginId,
        role: signupForm.role,
        password: signupForm.password,
        address: signupForm.address,
        addressDetail: signupForm.addressDetail,
        phone: signupForm.phone,
      }),
    })

    if (!response.ok) {
      setAuthMessage(await readResponseMessage(response))
      return
    }

    window.alert('회원가입이 완료되었습니다.')
    setAuthMessage('회원가입이 완료되었습니다. 로그인해주세요.')
    setLoginId(signupForm.loginId || signupForm.email)
    setAuthMode('login')
  }

  async function checkLoginId() {
    const loginId = signupForm.loginId.trim()
    setAuthMessage('')
    setLoginIdCheckMessage('')

    if (!loginId) {
      setLoginIdCheckMessage('아이디를 입력해주세요.')
      setIsLoginIdAvailable(false)
      return
    }

    setIsCheckingLoginId(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`,
      )

      if (!response.ok) {
        setLoginIdCheckMessage(await readResponseMessage(response))
        setIsLoginIdAvailable(false)
        return
      }

      const available = (await response.json()) as boolean
      setIsLoginIdAvailable(available)
      setLoginIdCheckMessage(
        available ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.',
      )
    } catch {
      setIsLoginIdAvailable(false)
      setLoginIdCheckMessage('아이디 중복확인에 실패했습니다.')
    } finally {
      setIsCheckingLoginId(false)
    }
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
      setAuthMessage(await readResponseMessage(response))
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
    setAccountRole(role)
    setIsLoggedIn(true)
    setLoginPassword('')
    setAuthMessage('')
    setView(role === 'SELLER' || role === 'ADMIN' ? 'seller' : 'home')
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

  const productPrice = selectedProduct ? (selectedProduct.salePrice ?? selectedProduct.price) : 0
  const productTotal = productPrice * quantity

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
          {isLoggedIn && (accountRole === 'SELLER' || accountRole === 'ADMIN') && (
            <button type="button" onClick={() => setView('seller')}>
              판매자센터
            </button>
          )}
          <button type="button" onClick={isLoggedIn ? logout : openLogin}>
            {isLoggedIn ? '로그아웃' : '로그인'}
          </button>
          <button type="button">내정보</button>
          <a href="#cart" onClick={() => setView('shop')}>
            장바구니 {cart.length > 0 && <span>{cart.length}</span>}
          </a>
          <button type="button">설정</button>
        </nav>
      </header>

      {view === 'seller' ? (
        <SellerDashboard role={accountRole} onLogout={logout} />
      ) : view === 'auth' ? (
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
                    placeholder="아이디를 입력하세요"
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
                <div className="address-row">
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
                  <button type="button" onClick={checkLoginId} disabled={isCheckingLoginId}>
                    {isCheckingLoginId ? '확인중' : '중복확인'}
                  </button>
                </div>
                {loginIdCheckMessage && (
                  <p className={isLoginIdAvailable ? 'auth-success' : 'auth-message'}>
                    {loginIdCheckMessage}
                  </p>
                )}
                <fieldset className="role-select">
                  <legend>계정 유형</legend>
                  {(Object.keys(roleLabels) as Array<Exclude<UserRole, 'ADMIN'>>).map((role) => (
                    <label key={role} className={signupForm.role === role ? 'is-selected' : ''}>
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={signupForm.role === role}
                        onChange={() => changeSignupField('role', role)}
                      />
                      <span>{roleLabels[role]}</span>
                      <small>
                        {role === 'USER'
                          ? '상품을 둘러보고 주문합니다.'
                          : '상품과 주문, 매출을 관리합니다.'}
                      </small>
                    </label>
                  ))}
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

            {carouselProduct ? (
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
            ) : (
              <div className="carousel-card">
                <div>
                  <span>{isProductsLoading ? '상품 불러오는 중' : '상품 준비 중'}</span>
                  <h2>{isProductsLoading ? '상품 목록을 불러오고 있습니다' : '등록된 상품이 없습니다'}</h2>
                  <p>{productError || '백엔드 상품 API와 연결되면 이 영역에 추천 상품이 표시됩니다.'}</p>
                </div>
              </div>
            )}
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
              {newProducts.length > 0 ? (
                newProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                    <img src={product.images[0]} alt={product.name} />
                    <span>{product.name}</span>
                    <strong>{product.price.toLocaleString()}원</strong>
                  </button>
                ))
              ) : (
                <p className="empty-message">
                  {isProductsLoading ? '상품 목록을 불러오고 있습니다.' : productError || '등록된 상품이 없습니다.'}
                </p>
              )}
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
              {saleProducts.length > 0 ? (
                saleProducts.map((product) => (
                  <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                    <img src={product.images[0]} alt={product.name} />
                    <span>{product.name}</span>
                    <del>{product.price.toLocaleString()}원</del>
                    <strong>{product.salePrice?.toLocaleString()}원</strong>
                  </button>
                ))
              ) : (
                <p className="empty-message">현재 특가 상품이 없습니다.</p>
              )}
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
                {homeSearchProducts.length > 0 ? (
                  homeSearchProducts.map((product) => (
                    <button key={product.id} type="button" onClick={() => selectProduct(product)}>
                      <img src={product.images[0]} alt={product.name} />
                      <span>{product.name}</span>
                      <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                    </button>
                  ))
                ) : (
                  <p className="empty-message">검색 결과가 없습니다.</p>
                )}
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
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className={selectedProduct?.id === product.id ? 'product-tile is-selected' : 'product-tile'}
                onClick={() => selectProduct(product)}
              >
                <img src={product.images[0]} alt={product.name} />
                <span>{product.name}</span>
                <strong>{(product.salePrice ?? product.price).toLocaleString()}원</strong>
                {product.salePrice && <em>특가</em>}
              </button>
            ))
          ) : (
            <p className="empty-message">
              {isProductsLoading ? '상품 목록을 불러오고 있습니다.' : productError || '표시할 상품이 없습니다.'}
            </p>
          )}
        </aside>

        <section className="product-detail" aria-label="상품 상세">
          {selectedProduct ? (
            <>
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
            </>
          ) : (
            <div className="purchase-panel">
              <p className="empty-message">
                {isProductsLoading ? '상품 상세 정보를 불러오고 있습니다.' : productError || '선택할 상품이 없습니다.'}
              </p>
            </div>
          )}
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

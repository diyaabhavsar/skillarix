
# Project Structure

```
src/
│
├── app/
│   ├── providers.tsx                   # All app providers wrapper
│   └── routes.tsx                      # App routing configuration
│
├── assets/
│   ├── fonts/                          # Custom fonts
│   └── images/                         # Static images
│
├── components/
│   ├── common/                         # Shared components across domains
│   │   ├── ErrorBoundary.tsx           # Global error handling component
│   │   ├── LoadingSpinner.tsx          # Global loading indicator
│   │   └── PageTransition.tsx          # Page transition animations
│   │
│   ├── layout/                         # Layout components
│   │   ├── AppLayout.tsx               # Main app layout
│   │   ├── Breadcrumbs.tsx             # Breadcrumb navigation
│   │   ├── MainHeader.tsx              # Main header component 
│   │   ├── SidebarHeader.tsx           # Sidebar header component
│   │   ├── SidebarNav.tsx              # Sidebar navigation
│   │   └── UserFooter.tsx              # User info footer component
│   │
│   ├── ui/                             # Shadcn UI components
│   │   ├── button.tsx                  # Button component
│   │   ├── dialog.tsx                  # Dialog component
│   │   ├── toast.tsx                   # Toast component
│   │   └── ...                         # Other shadcn components
│   │
│   ├── auth/                           # Authentication components
│   │   ├── LoginForm.tsx               # Login form
│   │   ├── RegisterForm.tsx            # Registration form
│   │   └── ForgotPasswordDialog.tsx    # Password reset dialog
│   │
│   ├── dashboard/                      # Dashboard-related components
│   │   ├── MetricsOverview.tsx         # Metrics and KPIs component
│   │   ├── PerformanceInsights.tsx     # Performance insights component
│   │   ├── ProductsGrid.tsx            # Products display grid
│   │   └── RecentSessions.tsx          # Recent sessions list
│   │
│   ├── practice/                       # Practice session components
│   │   ├── CustomerQuestion.tsx        # Customer question display
│   │   ├── SalespersonResponse.tsx     # Salesperson response input
│   │   ├── PracticeSessionContainer.tsx # Practice session wrapper
│   │   └── ...                         # Other practice components
│   │
│   ├── feedback/                       # Feedback-related components
│   │   ├── QAAnalysis.tsx              # Q&A analysis component
│   │   ├── MidSessionEvaluation.tsx    # Mid-session evaluation
│   │   └── FinalAssessment.tsx         # Final assessment component
│   │
│   ├── setup/                          # Setup-related components
│   │   ├── FileUploadSection.tsx       # File upload section
│   │   ├── ProductInfoForm.tsx         # Product information form
│   │   └── ...                         # Other setup components
│   │
│   └── past-sessions/                  # Past sessions components
│       ├── PastSessionsTable.tsx       # Sessions history table
│       └── SessionsPagination.tsx      # Pagination for sessions
│
├── contexts/
│   ├── AuthContext.tsx                 # Authentication context
│   └── ThemeContext.tsx                # Theme context (if needed)
│
├── data/                               # Static data and mock data
│   ├── mockSessionsData.ts             # Mock sessions data
│   └── mockFeedbackData.ts             # Mock feedback data
│
├── features/                           # Feature modules (domain-specific)
│   ├── auth/                           # Authentication feature
│   │   ├── components/                 # Auth-specific components
│   │   ├── hooks/                      # Auth-specific hooks
│   │   ├── services/                   # Auth-specific services
│   │   └── types.ts                    # Auth-specific types
│   │
│   ├── dashboard/                      # Dashboard feature
│   │   ├── components/                 # Dashboard-specific components
│   │   ├── hooks/                      # Dashboard-specific hooks
│   │   ├── services/                   # Dashboard-specific services
│   │   └── types.ts                    # Dashboard-specific types
│   │
│   ├── practice/                       # Practice feature
│   │   ├── components/                 # Practice-specific components
│   │   ├── hooks/                      # Practice-specific hooks
│   │   ├── services/                   # Practice-specific services
│   │   └── types.ts                    # Practice-specific types
│   │
│   └── settings/                       # Settings feature
│       ├── components/                 # Settings-specific components
│       ├── hooks/                      # Settings-specific hooks
│       ├── services/                   # Settings-specific services
│       └── types.ts                    # Settings-specific types
│
├── hooks/
│   ├── use-auth.tsx                    # Authentication hooks
│   ├── use-toast.ts                    # Toast notification hooks
│   ├── use-mobile.tsx                  # Mobile detection hook
│   └── use-pdf-export.ts               # PDF export functionality
│
├── lib/
│   └── utils.ts                        # Utility functions
│
├── pages/
│   ├── Index.tsx                       # Landing page
│   ├── Auth.tsx                        # Authentication page
│   ├── Dashboard.tsx                   # Dashboard page
│   ├── Setup.tsx                       # Setup page
│   ├── Practice.tsx                    # Practice page list
│   ├── PracticeSession.tsx             # Active practice session page
│   ├── PastSessions.tsx                # Past sessions page
│   ├── FeedbackViewer.tsx              # Feedback details page
│   ├── Settings.tsx                    # Settings page
│   └── NotFound.tsx                    # 404 page
│
├── services/
│   ├── api.ts                          # API client configuration
│   ├── auth.service.ts                 # Authentication service
│   ├── practice.service.ts             # Practice sessions service
│   └── feedback.service.ts             # Feedback service
│
├── store/                              # Zustand store (alternative to context)
│   ├── auth.store.ts                   # Authentication store
│   ├── practice.store.ts               # Practice sessions store
│   └── feedback.store.ts               # Feedback store
│
├── styles/
│   └── globals.css                     # Global styles including Tailwind
│
├── types/                              # Global TypeScript types
│   ├── auth.types.ts                   # Authentication types
│   ├── practice.types.ts               # Practice session types
│   └── feedback.types.ts               # Feedback types
│
├── utils/                              # Utility functions
│   ├── date-formatter.ts               # Date formatting functions
│   ├── storage.ts                      # Local storage helpers
│   └── validation.ts                   # Form validation helpers
│
├── constants/                          # App constants
│   ├── routes.ts                       # Route constants
│   ├── api.ts                          # API endpoints constants
│   └── ui.ts                           # UI constants (colors, etc.)
│
├── App.tsx                             # Main App component
├── main.tsx                            # App entry point
└── vite-env.d.ts                       # Vite environment types
```

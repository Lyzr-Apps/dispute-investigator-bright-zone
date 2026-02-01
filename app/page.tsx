'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Smartphone,
  Users,
  TrendingUp,
  Clock,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertTriangle,
  Info,
  Eye,
  MessageCircle,
  CreditCard,
  User,
  Calendar,
  DollarSign,
  ArrowRight,
  BarChart,
  Shield
} from 'lucide-react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'

// TypeScript Interfaces based on ACTUAL test responses

// Case Manager Response
interface MerchantAnalysis {
  decoded_name: string
  is_subscription: boolean
  confidence: number
}

interface EvidenceSummary {
  location_verified: boolean
  device_verified: boolean
  family_usage_suspected: boolean
  evidence_score: number
}

interface RiskAssessment {
  friendly_fraud_score: number
  risk_level: string
  recommendation: string
}

interface CaseManagerResult {
  case_id: string
  cardholder_statement: string
  merchant_analysis: MerchantAnalysis
  evidence_summary: EvidenceSummary
  risk_assessment: RiskAssessment
  case_summary: string
  recommended_action: string
  key_findings: string[]
  next_steps: string[]
}

// Evidence Correlator Response
interface LocationMatch {
  user_was_present: boolean
  distance_from_transaction: number
  user_location_at_time: string
  transaction_location: string
  confidence: number
}

interface DeviceMatch {
  device_id_matches: boolean
  registered_device: string
  transaction_device_id: string
  is_known_device: boolean
}

interface FamilyUsageAnalysis {
  potential_family_member: string | null
  family_member_likelihood: number
  supporting_evidence: string[]
}

interface EvidenceCorrelatorResult {
  location_match: LocationMatch
  device_match: DeviceMatch
  family_usage_analysis: FamilyUsageAnalysis
  overall_evidence_score: number
  red_flags: string[]
  supporting_factors: string[]
}

// Risk Scoring Response
interface AccountAnalysis {
  account_age_days: number
  account_standing: string
  average_monthly_deposits: number
  deposit_consistency: string
}

interface DisputeHistory {
  total_disputes: number
  disputes_last_12_months: number
  win_rate: number
  patterns: string[]
}

interface FraudIndicators {
  in_fraud_database: boolean
  fraud_alerts: string[]
  velocity_flags: string[]
}

interface RiskFactor {
  factor: string
  severity: string
  impact_on_score: number
}

interface RiskScoringResult {
  friendly_fraud_score: number
  risk_level: string
  account_analysis: AccountAnalysis
  dispute_history: DisputeHistory
  fraud_indicators: FraudIndicators
  risk_factors: RiskFactor[]
  recommendation: string
  reasoning: string
}

// Resolution Response
interface ProvisionalCredit {
  credited: boolean
  credit_amount: number
  credit_date: string
  reversal_date: string | null
}

interface Chargeback {
  filed: boolean
  chargeback_id: string
  reason_code: string
  network: string
  filing_date: string
  expected_resolution_date: string
}

interface ResolutionDetails {
  provisional_credit: ProvisionalCredit
  chargeback: Chargeback
}

interface Tracking {
  case_status: string
  next_review_date: string
  outcome_updates: string[]
}

interface CustomerNotification {
  sent: boolean
  notification_type: string
  message_preview: string
}

interface TransactionDetails {
  transaction_id: string
  amount: number
  merchant_name: string
  transaction_date: string | null
}

interface ResolutionResult {
  action_taken: string
  transaction_details: TransactionDetails
  resolution_details: ResolutionDetails
  tracking: Tracking
  customer_notification: CustomerNotification
  compliance_notes: string
}

// Mock case data
interface CaseData {
  id: string
  customer_name: string
  amount: number
  merchant: string
  date: string
  status: 'pending' | 'approved' | 'denied' | 'escalated'
  risk_score: number
  priority: 'high' | 'medium' | 'low'
}

const MOCK_CASES: CaseData[] = [
  {
    id: 'SQJOESCAFE-2024-01-15-1459',
    customer_name: 'Alex Johnson',
    amount: 45.99,
    merchant: 'SQ *JOES CAFE',
    date: '2024-01-15',
    status: 'pending',
    risk_score: 68,
    priority: 'high'
  },
  {
    id: 'DSP-2024-001235',
    customer_name: 'Maria Garcia',
    amount: 129.99,
    merchant: 'AMAZON.COM',
    date: '2024-01-14',
    status: 'pending',
    risk_score: 23,
    priority: 'low'
  },
  {
    id: 'DSP-2024-001236',
    customer_name: 'James Chen',
    amount: 599.00,
    merchant: 'BEST BUY',
    date: '2024-01-13',
    status: 'escalated',
    risk_score: 82,
    priority: 'high'
  }
]

// Agent IDs
const AGENT_IDS = {
  caseManager: '697ebb94d36f070193f5dfa1',
  merchantIntelligence: '697ebb44066158e77fde657f',
  evidenceCorrelator: '697ebb5b066158e77fde6580',
  riskScoring: '697ebb73066158e77fde6584',
  resolution: '697ebbb1d36f070193f5dfa2'
}

// Screen Components

// Screen 1: Customer Dispute Intake (Mobile)
function CustomerIntakeScreen({
  onSubmit
}: {
  onSubmit: (caseData: CaseManagerResult) => void
}) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent', text: string }>>([
    { role: 'agent', text: "Hi! I'm here to help with your transaction dispute. Can you tell me about the charge you don't recognize?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const transaction = {
    amount: 45.99,
    merchant: 'SQ *JOES CAFE',
    date: 'Jan 15, 2024 2:30 PM',
    status: 'Posted'
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (message?: string) => {
    const textToSend = message || input
    if (!textToSend.trim()) return

    setMessages(prev => [...prev, { role: 'user', text: textToSend }])
    setInput('')
    setShowQuickReplies(false)
    setLoading(true)

    try {
      const result = await callAIAgent(textToSend, AGENT_IDS.caseManager)

      if (result.success && result.response.status === 'success') {
        const caseData = result.response.result as CaseManagerResult

        const summaryText = caseData.case_summary
          ? (caseData.case_summary.length > 200
              ? caseData.case_summary.substring(0, 200) + '...'
              : caseData.case_summary)
          : 'I have analyzed the evidence and created a case for review.'

        setMessages(prev => [...prev, {
          role: 'agent',
          text: `Thanks for that information. I've created case ${caseData.case_id || 'DSP-' + Date.now()} and analyzed the evidence. ${summaryText}`
        }])

        setTimeout(() => {
          onSubmit(caseData)
        }, 2000)
      } else {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: "I understand you're disputing this charge. Let me gather more information to help resolve this."
        }])
        setLoading(false)
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'agent',
        text: "I'm having trouble processing your request. Please try again."
      }])
      setLoading(false)
    }
  }

  const quickReplies = [
    "I don't recognize this charge",
    "I never went to this place",
    "My card was stolen",
    "This looks like fraud"
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto">
      {/* Transaction Card - Pinned */}
      <div className="sticky top-0 z-10 bg-white border-b p-4 shadow-sm">
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-600">Transaction</p>
                <p className="font-semibold text-lg">{transaction.merchant}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xl text-red-600">-${transaction.amount}</p>
                <Badge variant="outline" className="mt-1">{transaction.status}</Badge>
              </div>
            </div>
            <p className="text-sm text-gray-600">{transaction.date}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex",
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Replies */}
        {showQuickReplies && !loading && (
          <div className="mt-4 space-y-2">
            {quickReplies.map((reply, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start text-left"
                onClick={() => handleSend(reply)}
              >
                {reply}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-[#00D4AA] hover:bg-[#00B894]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button className="flex-1 bg-[#00D4AA] hover:bg-[#00B894]">
            Submit Dispute
          </Button>
          <Button variant="outline" className="flex-1">
            Cancel - I Recognize This
          </Button>
        </div>
      </div>
    </div>
  )
}

// Screen 2: Analyst Review Dashboard
function AnalystDashboard({
  onSelectCase
}: {
  onSelectCase: (caseId: string) => void
}) {
  const [cases, setCases] = useState<CaseData[]>(MOCK_CASES)
  const [selectedCase, setSelectedCase] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'risk' | 'amount'>('risk')

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (searchQuery && !c.merchant.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sortBy === 'risk') return b.risk_score - a.risk_score
    if (sortBy === 'amount') return b.amount - a.amount
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'bg-red-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk'
    if (score >= 40) return 'Medium Risk'
    return 'Low Risk'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dispute Review Dashboard</h1>
            <p className="text-sm text-gray-600">Analyst Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {filteredCases.length} Active Cases
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Column: Case Queue (25%) */}
        <div className="w-1/4 border-r bg-white overflow-y-auto">
          <div className="p-4 border-b bg-gray-50">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="risk">Sort by Risk</SelectItem>
                  <SelectItem value="amount">Sort by Amount</SelectItem>
                  <SelectItem value="date">Sort by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="divide-y">
            {filteredCases.map((caseItem) => (
              <div
                key={caseItem.id}
                onClick={() => setSelectedCase(caseItem.id)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  selectedCase === caseItem.id && "bg-blue-50 border-l-4 border-blue-600"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{caseItem.customer_name}</p>
                    <p className="text-xs text-gray-600">{caseItem.id}</p>
                  </div>
                  <Badge className={cn("text-white", getRiskColor(caseItem.risk_score))}>
                    {caseItem.risk_score}%
                  </Badge>
                </div>
                <p className="text-sm font-medium mb-1">{caseItem.merchant}</p>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>${caseItem.amount}</span>
                  <span>{caseItem.date}</span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {caseItem.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center Column: Case Detail (50%) */}
        <div className="w-1/2 overflow-y-auto bg-gray-50 p-6">
          {selectedCase ? (
            <CaseDetailView caseId={selectedCase} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Select a case to review</p>
                <p className="text-sm">Choose a case from the queue to see details</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Action Panel (25%) */}
        <div className="w-1/4 border-l bg-white p-6">
          {selectedCase ? (
            <ActionPanel caseId={selectedCase} onAction={(action) => {
              console.log('Action:', action)
              onSelectCase(selectedCase)
            }} />
          ) : (
            <div className="text-center text-gray-400 mt-12">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No case selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Case Detail View Component
function CaseDetailView({ caseId }: { caseId: string }) {
  const [caseData, setCaseData] = useState<CaseManagerResult | null>(null)
  const [evidenceData, setEvidenceData] = useState<EvidenceCorrelatorResult | null>(null)
  const [riskData, setRiskData] = useState<RiskScoringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    loadCaseData()
  }, [caseId])

  const loadCaseData = async () => {
    setLoading(true)
    try {
      // Simulate loading case data
      const mockMessage = "I see a charge for $45.99 from 'SQ *JOES CAFE' on January 15th at 2:30 PM. I don't remember going to any Joe's Cafe."
      const result = await callAIAgent(mockMessage, AGENT_IDS.caseManager)

      if (result.success && result.response.result) {
        setCaseData(result.response.result as CaseManagerResult)
      }
    } catch (error) {
      console.error('Error loading case:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="text-center text-gray-500 mt-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Unable to load case data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Case {caseData.case_id}</CardTitle>
              <CardDescription className="mt-1">
                {caseData.merchant_analysis.decoded_name} - ${MOCK_CASES[0].amount}
              </CardDescription>
            </div>
            <Badge className={cn(
              "text-white",
              caseData.risk_assessment.risk_level === 'high' ? 'bg-red-500' :
              caseData.risk_assessment.risk_level === 'medium' ? 'bg-amber-500' :
              'bg-green-500'
            )}>
              {Math.round(caseData.risk_assessment.friendly_fraud_score * 100)}% Risk
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Case Summary</p>
                <p className="text-sm">{caseData.case_summary}</p>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">AI Recommendation</p>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(caseData.merchant_analysis.confidence * 100)}% confidence
                  </Badge>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    {caseData.recommended_action.replace(/_/g, ' ').toUpperCase()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Key Findings</p>
                <ul className="space-y-2">
                  {caseData.key_findings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className={caseData.evidence_summary.location_verified ? 'border-green-300' : 'border-red-300'}>
              <CardContent className="p-4 text-center">
                <MapPin className={cn(
                  "w-6 h-6 mx-auto mb-2",
                  caseData.evidence_summary.location_verified ? 'text-green-600' : 'text-red-600'
                )} />
                <p className="text-xs font-medium">Location</p>
                <p className="text-xs text-gray-600">
                  {caseData.evidence_summary.location_verified ? 'Verified' : 'Not Verified'}
                </p>
              </CardContent>
            </Card>

            <Card className={caseData.evidence_summary.device_verified ? 'border-green-300' : 'border-red-300'}>
              <CardContent className="p-4 text-center">
                <Smartphone className={cn(
                  "w-6 h-6 mx-auto mb-2",
                  caseData.evidence_summary.device_verified ? 'text-green-600' : 'text-red-600'
                )} />
                <p className="text-xs font-medium">Device</p>
                <p className="text-xs text-gray-600">
                  {caseData.evidence_summary.device_verified ? 'Matched' : 'Not Matched'}
                </p>
              </CardContent>
            </Card>

            <Card className={caseData.evidence_summary.family_usage_suspected ? 'border-amber-300' : 'border-gray-300'}>
              <CardContent className="p-4 text-center">
                <Users className={cn(
                  "w-6 h-6 mx-auto mb-2",
                  caseData.evidence_summary.family_usage_suspected ? 'text-amber-600' : 'text-gray-400'
                )} />
                <p className="text-xs font-medium">Family Usage</p>
                <p className="text-xs text-gray-600">
                  {caseData.evidence_summary.family_usage_suspected ? 'Suspected' : 'Not Detected'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Friendly Fraud Probability</p>
                  <Badge className={cn(
                    "text-white",
                    caseData.risk_assessment.friendly_fraud_score >= 0.7 ? 'bg-red-500' :
                    caseData.risk_assessment.friendly_fraud_score >= 0.4 ? 'bg-amber-500' :
                    'bg-green-500'
                  )}>
                    {Math.round(caseData.risk_assessment.friendly_fraud_score * 100)}%
                  </Badge>
                </div>
                <Progress
                  value={caseData.risk_assessment.friendly_fraud_score * 100}
                  className="h-2"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Evidence Score</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={caseData.evidence_summary.evidence_score * 100}
                    className="h-2 flex-1"
                  />
                  <span className="text-sm font-medium">
                    {Math.round(caseData.evidence_summary.evidence_score * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">GPS Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">GPS Map Overlay</p>
                  <p className="text-xs text-gray-500">San Francisco, CA</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Transaction Location:</span>
                  <span className="font-medium">37.7749, -122.4194</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">User Location:</span>
                  <span className="font-medium">
                    {caseData.evidence_summary.location_verified ? 'Nearby' : 'Distant'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Fingerprint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Transaction Device</p>
                      <p className="text-xs text-gray-600">px6a-0012</p>
                    </div>
                  </div>
                  {caseData.evidence_summary.device_verified ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Registered Device</p>
                      <p className="text-xs text-gray-600">px6a-0012</p>
                    </div>
                  </div>
                  <Badge variant="outline">Primary</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Merchant History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Merchant Name:</span>
                  <span className="font-medium">{caseData.merchant_analysis.decoded_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Is Subscription:</span>
                  <Badge variant={caseData.merchant_analysis.is_subscription ? 'default' : 'outline'}>
                    {caseData.merchant_analysis.is_subscription ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">{Math.round(caseData.merchant_analysis.confidence * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TimelineItem
                  icon={<FileText className="w-4 h-4" />}
                  title="Dispute Submitted"
                  time="Jan 15, 2024 2:45 PM"
                  description="Customer reported unrecognized transaction"
                />
                <TimelineItem
                  icon={<BarChart className="w-4 h-4" />}
                  title="Evidence Collected"
                  time="Jan 15, 2024 2:46 PM"
                  description="GPS, device, and merchant data analyzed"
                />
                <TimelineItem
                  icon={<AlertTriangle className="w-4 h-4" />}
                  title="Risk Assessment Complete"
                  time="Jan 15, 2024 2:47 PM"
                  description={`${Math.round(caseData.risk_assessment.friendly_fraud_score * 100)}% friendly fraud risk detected`}
                />
                <TimelineItem
                  icon={<Eye className="w-4 h-4" />}
                  title="Pending Manual Review"
                  time="Jan 15, 2024 2:48 PM"
                  description="Awaiting analyst decision"
                  isLast
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reg E Compliance Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Submission Date:</span>
                <span className="font-medium">Jan 15, 2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Investigation Deadline:</span>
                <span className="font-medium text-amber-600">Feb 14, 2024 (30 days)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Provisional Credit Due:</span>
                <span className="font-medium">Jan 25, 2024 (10 days)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analyst Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this case..."
                className="min-h-[200px]"
              />
              <Button className="mt-3 w-full">Save Notes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {caseData.next_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Timeline Item Component
function TimelineItem({
  icon,
  title,
  time,
  description,
  isLast = false
}: {
  icon: React.ReactNode
  title: string
  time: string
  description: string
  isLast?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-600 mb-1">{time}</p>
        <p className="text-sm text-gray-700">{description}</p>
      </div>
    </div>
  )
}

// Action Panel Component
function ActionPanel({
  caseId,
  onAction
}: {
  caseId: string
  onAction: (action: string) => void
}) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-3">Decision Actions</h3>
        <div className="space-y-2">
          <Button
            onClick={() => setSelectedAction('approve')}
            className="w-full bg-[#00D4AA] hover:bg-[#00B894] justify-start"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve Credit
          </Button>
          <Button
            onClick={() => setSelectedAction('deny')}
            variant="destructive"
            className="w-full justify-start"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Deny with Explanation
          </Button>
          <Button
            onClick={() => setSelectedAction('request_info')}
            variant="outline"
            className="w-full justify-start"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Request More Info
          </Button>
          <Button
            onClick={() => setSelectedAction('escalate')}
            variant="outline"
            className="w-full justify-start border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Escalate to Specialist
          </Button>
        </div>
      </div>

      {selectedAction && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Add decision notes:</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain your decision..."
              className="mb-3 bg-white"
            />
            <Button
              onClick={() => onAction(selectedAction)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Confirm Decision
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div>
        <h4 className="font-semibold text-sm mb-2">Quick Actions</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <User className="w-3 h-3 mr-2" />
            Contact Customer
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <CreditCard className="w-3 h-3 mr-2" />
            View Account History
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <FileText className="w-3 h-3 mr-2" />
            Export Case Report
          </Button>
        </div>
      </div>
    </div>
  )
}

// Screen 4: Customer Resolution Screen (Mobile)
function CustomerResolutionScreen({
  resolution
}: {
  resolution: 'approved' | 'denied'
}) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Dispute Status</h1>
        <p className="text-sm text-gray-600">Case #SQJOESCAFE-2024-01-15-1459</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Card */}
        <Card className={cn(
          resolution === 'approved'
            ? 'border-green-300 bg-green-50'
            : 'border-red-300 bg-red-50'
        )}>
          <CardContent className="p-6 text-center">
            {resolution === 'approved' ? (
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            )}
            <h2 className={cn(
              "text-2xl font-bold mb-2",
              resolution === 'approved' ? 'text-green-900' : 'text-red-900'
            )}>
              {resolution === 'approved' ? 'Dispute Approved' : 'Dispute Denied'}
            </h2>
            <p className="text-sm text-gray-700">
              {resolution === 'approved'
                ? 'We have issued a provisional credit to your account'
                : 'We were unable to approve your dispute claim'
              }
            </p>
          </CardContent>
        </Card>

        {/* Plain Language Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What This Means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolution === 'approved' ? (
              <>
                <p className="text-sm">
                  We have credited $45.99 back to your account while we investigate this transaction.
                  This credit is provisional, meaning it will remain in your account unless our
                  investigation finds the transaction was authorized.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">What happens next?</p>
                      <p className="text-xs text-blue-800 mt-1">
                        We will contact the merchant and complete our investigation within 30 days.
                        You will keep the credit unless we find evidence the transaction was authorized.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm">
                  After reviewing the evidence, we found that the transaction appears to be authorized.
                  Our investigation showed your device and location matched the transaction, suggesting
                  you or someone with access to your card made this purchase.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Show'} Detailed Evidence
                  {showDetails ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                </Button>
                {showDetails && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Location Match</p>
                        <p className="text-xs text-gray-600">
                          Your phone was within 0.1 miles of the merchant at the time of transaction
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Smartphone className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Device Match</p>
                        <p className="text-xs text-gray-600">
                          The transaction was made with your registered device (Pixel 6A)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium">Dispute Submitted</p>
                  <p className="text-xs text-gray-600">January 15, 2024</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium">Investigation Started</p>
                  <p className="text-xs text-gray-600">January 15, 2024</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  {resolution === 'approved' && <div className="w-0.5 flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <p className="text-sm font-medium">Decision Made</p>
                  <p className="text-xs text-gray-600">January 16, 2024</p>
                </div>
              </div>
              {resolution === 'approved' && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Final Resolution</p>
                    <p className="text-xs text-gray-500">Expected by February 14, 2024</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reg E Compliance Info */}
        {resolution === 'approved' && (
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Your Rights Under Regulation E</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Under federal law, we must investigate your claim within 10 business days and
                    complete the investigation within 45 days. You have the right to request
                    documentation of our findings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appeal Option */}
        {resolution === 'denied' && (
          <Button variant="outline" className="w-full">
            <AlertCircle className="w-4 h-4 mr-2" />
            This doesn't seem right - Appeal Decision
          </Button>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <DollarSign className="w-4 h-4 mr-2" />
            View Account Balance
          </Button>
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}

// Main App Component
export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'intake' | 'dashboard' | 'resolution'>('intake')
  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'denied'>('approved')
  const [selectedCase, setSelectedCase] = useState<CaseManagerResult | null>(null)

  const handleIntakeSubmit = (caseData: CaseManagerResult) => {
    setSelectedCase(caseData)
    setCurrentScreen('dashboard')
  }

  const handleDashboardAction = (caseId: string) => {
    // Simulate processing decision
    setResolutionStatus('approved')
    setCurrentScreen('resolution')
  }

  // Demo Controls
  const DemoControls = () => (
    <div className="fixed bottom-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-4">
      <p className="text-xs font-semibold mb-2 text-gray-700">Demo Navigation</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={currentScreen === 'intake' ? 'default' : 'outline'}
          onClick={() => setCurrentScreen('intake')}
          className="text-xs"
        >
          Customer Intake
        </Button>
        <Button
          size="sm"
          variant={currentScreen === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setCurrentScreen('dashboard')}
          className="text-xs"
        >
          Analyst Dashboard
        </Button>
        <Button
          size="sm"
          variant={currentScreen === 'resolution' ? 'default' : 'outline'}
          onClick={() => setCurrentScreen('resolution')}
          className="text-xs"
        >
          Resolution
        </Button>
      </div>
      {currentScreen === 'resolution' && (
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant={resolutionStatus === 'approved' ? 'default' : 'outline'}
            onClick={() => setResolutionStatus('approved')}
            className="text-xs flex-1"
          >
            Approved
          </Button>
          <Button
            size="sm"
            variant={resolutionStatus === 'denied' ? 'default' : 'outline'}
            onClick={() => setResolutionStatus('denied')}
            className="text-xs flex-1"
          >
            Denied
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {currentScreen === 'intake' && (
        <CustomerIntakeScreen onSubmit={handleIntakeSubmit} />
      )}
      {currentScreen === 'dashboard' && (
        <AnalystDashboard onSelectCase={handleDashboardAction} />
      )}
      {currentScreen === 'resolution' && (
        <CustomerResolutionScreen resolution={resolutionStatus} />
      )}
      <DemoControls />
    </>
  )
}

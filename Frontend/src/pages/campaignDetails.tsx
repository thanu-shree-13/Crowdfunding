import { useContext, useEffect, useState } from "react"
import { Location, useLocation } from "react-router-dom"
import { StateContext } from "../contexts"
import { calculateBarPercentage, daysLeft } from "../utils"
import { CountBox } from "../components/countBox"
import { thirdweb } from "../assets"
import { CustomButton } from "../components/customButton"
import { Loader } from "../components/loader"
import { ethers } from "ethers"

type ParsedCampaign = {
    owner: string
    title: string
    description: string
    target: string
    deadline: number
    amountCollected: string
    withdrawableAmount: string
    fraudScore: number
    isFlagged: boolean
    image: string
    pId: string
}

type ParsedDonation = {
    donator: string
    donation: string
    timestamp?: number
}

export function CampaignDetails() {

    const { state } = useLocation() as Location<ParsedCampaign>
    const { donate, getDonations, contract, address } = useContext(StateContext)

    const [isLoading, setIsLoading] = useState(false)
    const [amount, setAmount] = useState('')
    const [donators, setDonators] = useState<ParsedDonation[]>([])
    const [copied, setCopied] = useState(false)

    const remainingDays = daysLeft(state.deadline)

    async function fetchDonators() {
        try {
            const data: any = await getDonations(state.pId)

            if (!data || data.length < 2) {
                setDonators([])
                return
            }

            const parsed = data[0].map((donator: string, i: number) => ({
                donator,
                donation: ethers.utils.formatEther(data[1][i].toString()),
                timestamp: data[2]?.[i] ? Number(data[2][i]) : Date.now()
            }))

            // Sort by most recent first
            parsed.sort((a: ParsedDonation, b: ParsedDonation) => 
                (b.timestamp || 0) - (a.timestamp || 0)
            )

            setDonators(parsed)

        } catch (err) {
            console.log(err)
            setDonators([])
        }
    }

    useEffect(() => {
        if (contract && state?.pId) {
            fetchDonators()
        }
    }, [contract, address, state?.pId])

    async function handleDonate() {
        if (!amount || Number(amount) <= 0) return

        setIsLoading(true)

        try {
            await donate(state.pId, amount)
            await fetchDonators()
            setAmount('')
        } catch (err) {
            console.log(err)
        }

        setIsLoading(false)
    }

    const fraudScore = state.fraudScore ?? 0
    const isHighRisk = fraudScore >= 70
    const isMediumRisk = fraudScore >= 40 && fraudScore < 70

    const getFraudConfig = () => {
        if (isHighRisk) {
            return {
                label: "High Fraud Risk",
                borderColor: "border-red-500",
                bgColor: "bg-red-500/10",
                textColor: "text-red-400",
                barColor: "bg-red-500",
                glow: "shadow-red-500/20",
                description: "Multiple suspicious patterns detected. Exercise extreme caution before contributing."
            }
        } else if (isMediumRisk) {
            return {
                label: "Medium Fraud Risk",
                borderColor: "border-yellow-500",
                bgColor: "bg-yellow-500/10",
                textColor: "text-yellow-400",
                barColor: "bg-yellow-500",
                glow: "shadow-yellow-500/20",
                description: "Some concerns detected. Verify campaign details before donating."
            }
        } else {
            return {
                label: "Low Fraud Risk",
                borderColor: "border-green-500",
                bgColor: "bg-green-500/10",
                textColor: "text-green-400",
                barColor: "bg-green-500",
                glow: "shadow-green-500/20",
                description: "Blockchain verified. This campaign appears trustworthy."
            }
        }
    }

    const fraudConfig = getFraudConfig()

    const formatAddress = (addr: string) => {
        if (!addr) return "Unknown"
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }

    const formatDateTime = (timestamp?: number) => {
        if (!timestamp) return "Date not available"
        const date = new Date(timestamp)
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const copyAddress = () => {
        navigator.clipboard.writeText(state.owner)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const progressPercent = calculateBarPercentage(
        Number(state.target),
        Number(state.amountCollected)
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] to-[#12121a]">
            {isLoading && <Loader />}

            {!isLoading && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    
                    {/* Header with Title */}
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent">
                            {state.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="text-sm text-gray-500">Campaign Active</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span className="text-sm text-gray-500">Created on Blockchain</span>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                        
                        {/* Left Column - Image & Details */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Campaign Image */}
                            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800 bg-[#0f0f14]">
                                <img
                                    src={state.image}
                                    alt={state.title}
                                    className="w-full h-[380px] md:h-[420px] object-cover hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x400?text=Campaign+Image"
                                    }}
                                />
                            </div>

                            {/* Fraud Score Card */}
                            <div className={`rounded-2xl border-2 ${fraudConfig.borderColor} ${fraudConfig.glow} shadow-lg overflow-hidden bg-gradient-to-br from-[#13131a] to-[#0d0d12]`}>
                                <div className="p-6">
                                    <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fraudConfig.bgColor} ${fraudConfig.borderColor} border`}>
                                                <span className="text-2xl">
                                                    {isHighRisk ? "⚠️" : isMediumRisk ? "📊" : "✅"}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-wider">Fraud Score</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-4xl font-bold ${fraudConfig.textColor}`}>
                                                        {fraudScore}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">/100</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full ${fraudConfig.bgColor} border ${fraudConfig.borderColor}`}>
                                            <span className={`font-semibold text-sm ${fraudConfig.textColor}`}>
                                                {fraudConfig.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Fraud Score Progress Bar */}
                                    <div className="mb-4">
                                        <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${fraudConfig.barColor} transition-all duration-1000 ease-out`}
                                                style={{ width: `${fraudScore}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                                            <span>Safe (0)</span>
                                            <span>Moderate (40)</span>
                                            <span>Risky (70+)</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 text-sm leading-relaxed">
                                        {fraudConfig.description}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-gray-800 flex flex-wrap gap-4 text-xs">
                                        <span className="flex items-center gap-1.5 text-gray-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Blockchain Verified
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            AI Risk Analysis
                                        </span>
                                        <span className="flex items-center gap-1.5 text-gray-500">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                            On-chain Data
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="bg-[#13131a] rounded-2xl border border-gray-800 p-6">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-gray-400 text-sm">Funding Progress</span>
                                    <span className="text-white font-bold text-xl">{progressPercent}%</span>
                                </div>
                                <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="absolute h-full bg-gradient-to-r from-[#4acd8d] to-[#2d9c6b] rounded-full transition-all duration-700"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-5">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Raised</p>
                                        <p className="text-white text-xl font-bold">{state.amountCollected} ETH</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Target</p>
                                        <p className="text-white text-xl font-bold">{state.target} ETH</p>
                                    </div>
                                </div>
                            </div>

                            {/* Story Section */}
                            <div className="bg-[#13131a] rounded-2xl border border-gray-800 p-6">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl"></span>
                                    Story
                                </h3>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                        {state.description}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Stats & Actions */}
                        <div className="space-y-6">
                            
                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-[#13131a] to-[#0d0d12] rounded-2xl border border-gray-800 p-4 text-center hover:border-gray-700 transition-all">
                                    <div className="text-3xl mb-2">📅</div>
                                    <p className="text-2xl font-bold text-white">{remainingDays}</p>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide mt-1">Days Left</p>
                                </div>
                                <div className="bg-gradient-to-br from-[#13131a] to-[#0d0d12] rounded-2xl border border-gray-800 p-4 text-center hover:border-gray-700 transition-all">
                                    <div className="text-3xl mb-2">👥</div>
                                    <p className="text-2xl font-bold text-white">{donators.length}</p>
                                    <p className="text-gray-500 text-xs uppercase tracking-wide mt-1">Backers</p>
                                </div>
                            </div>

                            {/* Fund Campaign Card */}
                            <div className="bg-gradient-to-br from-[#13131a] to-[#0d0d12] rounded-2xl border border-gray-800 p-6">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl"></span>
                                    Fund Campaign
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-gray-400 text-sm block mb-2">Amount (ETH)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">✦</span>
                                            <input
                                                type="number"
                                                placeholder="0.1"
                                                step="0.01"
                                                className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#4acd8d] focus:ring-1 focus:ring-[#4acd8d] transition-all"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <CustomButton
                                        btnType="button"
                                        title="Fund Campaign"
                                        styles="w-full bg-gradient-to-r from-[#4acd8d] to-[#2d9c6b] hover:opacity-90 transition-all font-semibold py-3 rounded-xl text-white shadow-lg shadow-[#4acd8d]/20"
                                        handleClick={handleDonate}
                                    />
                                </div>
                            </div>

                            {/* Recent Donators */}
                            <div className="bg-gradient-to-br from-[#13131a] to-[#0d0d12] rounded-2xl border border-gray-800 p-6">
                                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                        <span className="text-2xl"></span>
                                        Recent Donators
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                                        {donators.length} total
                                    </span>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {donators.length > 0 ? (
                                        donators.slice(0, 10).map((d, i) => (
                                            <div key={i} className="flex flex-col p-3 bg-[#0a0a0f] rounded-xl hover:bg-[#0f0f15] transition-all">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center">
                                                            <span className="text-xs text-gray-400 font-mono">#{i+1}</span>
                                                        </div>
                                                        <span className="text-gray-300 text-sm font-mono">
                                                            {formatAddress(d.donator)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[#4acd8d] font-semibold text-sm">{d.donation}</span>
                                                        <span className="text-gray-500 text-xs">ETH</span>
                                                    </div>
                                                </div>
                                                <div className="ml-10 mt-1">
                                                    <span className="text-gray-500 text-xs">
                                                        {formatDateTime(d.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="text-5xl mb-3 opacity-50"></div>
                                            <p className="text-gray-500">No donations yet</p>
                                            <p className="text-gray-600 text-sm mt-1">Be the first supporter!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Creator Card */}
                            <div className="bg-gradient-to-br from-[#13131a] to-[#0d0d12] rounded-2xl border border-gray-800 p-6">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <span className="text-2xl"></span>
                                    Creator
                                </h3>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#4acd8d] to-[#2d9c6b] flex items-center justify-center shadow-lg">
                                        <img src={thirdweb} className="w-7 h-7" alt="avatar" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-white font-mono text-sm">{formatAddress(state.owner)}</p>
                                            <button 
                                                onClick={copyAddress}
                                                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-md transition-all text-xs text-gray-400"
                                            >
                                                {copied ? "✓" : "📋"}
                                            </button>
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Verified Creator
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Warning for High Risk */}
                            {isHighRisk && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🚨</span>
                                        <div>
                                            <p className="text-red-400 font-semibold text-sm">High Risk Warning</p>
                                            <p className="text-gray-400 text-xs mt-1">This campaign has been flagged for potential fraud. Please verify all details before contributing.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Divider Footer */}
                    <div className="mt-10 pt-6 border-t border-gray-800 text-center">
                        <p className="text-gray-600 text-xs">
                            Powered by Blockchain • All transactions are verified on-chain
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
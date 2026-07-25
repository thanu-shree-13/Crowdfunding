import { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAddress } from "@thirdweb-dev/react";
import { CustomButton } from "../components/customButton";
import { StateContext } from "../contexts";
import { motion, AnimatePresence } from "framer-motion";
import { thirdweb } from "../assets";
import { Loader } from "../components/loader";

type ParsedCampaign = {
    owner: string;
    title: string;
    description: string;
    target: string;
    deadline: number;
    amountCollected: string;
    image: string;
    pId: string;
};

export function Payment() {
    const address = useAddress();
    const navigate = useNavigate();
    const { getUserCampaigns } = useContext(StateContext);

    const [inactiveCampaigns, setInactiveCampaigns] = useState<ParsedCampaign[]>([]);
    const [filteredCampaigns, setFilteredCampaigns] = useState<ParsedCampaign[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'recent' | 'oldest' | 'mostRaised' | 'leastRaised'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [selectedCampaign, setSelectedCampaign] = useState<ParsedCampaign | null>(null);
    const [showModal, setShowModal] = useState(false);

    const loadInactiveCampaigns = useCallback(async () => {
        if (!address) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            if (!getUserCampaigns) {
                throw new Error("Campaign service not available");
            }

            const campaigns = await getUserCampaigns();
            const campaignsArray: ParsedCampaign[] = Array.isArray(campaigns) ? campaigns : [];

            const nowMs = Date.now();

            const inactive = campaignsArray.filter((campaign) => {
                if (!campaign.deadline) return false;
                const deadlineMs = campaign.deadline.toString().length === 10
                    ? campaign.deadline * 1000
                    : campaign.deadline;
                return deadlineMs <= nowMs;
            });

            setInactiveCampaigns(inactive);
            applyFilters(inactive, selectedFilter, searchTerm);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setInactiveCampaigns([]);
            setFilteredCampaigns([]);
        } finally {
            setIsLoading(false);
        }
    }, [address, getUserCampaigns]);

    const applyFilters = (campaigns: ParsedCampaign[], filter: typeof selectedFilter, search: string) => {
        let filtered = [...campaigns];

        // Apply search filter
        if (search.trim()) {
            filtered = filtered.filter(campaign => 
                campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                campaign.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply sorting
        if (filter === "recent") {
            filtered.sort((a, b) => b.deadline - a.deadline);
        } else if (filter === "oldest") {
            filtered.sort((a, b) => a.deadline - b.deadline);
        } else if (filter === "mostRaised") {
            filtered.sort((a, b) => parseFloat(b.amountCollected) - parseFloat(a.amountCollected));
        } else if (filter === "leastRaised") {
            filtered.sort((a, b) => parseFloat(a.amountCollected) - parseFloat(b.amountCollected));
        }

        setFilteredCampaigns(filtered);
    };

    useEffect(() => {
        applyFilters(inactiveCampaigns, selectedFilter, searchTerm);
    }, [selectedFilter, searchTerm, inactiveCampaigns]);

    useEffect(() => {
        loadInactiveCampaigns();
    }, [loadInactiveCampaigns]);

    const formatEthAmount = (amount: string) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return "0";
        
        if (num === 0) return "0";
        if (num < 0.01) return num.toFixed(4);
        if (num < 1) return num.toFixed(3);
        return num.toFixed(2);
    };

    const getRaisedPercentage = (collected: string, target: string) => {
        const collectedNum = parseFloat(collected);
        const targetNum = parseFloat(target);
        if (targetNum === 0) return 0;
        const percentage = (collectedNum / targetNum) * 100;
        return Math.min(percentage, 100);
    };

    const getStatusColor = (collected: string, target: string) => {
        const percentage = getRaisedPercentage(collected, target);
        if (percentage === 0) return "from-red-600 to-red-700";
        if (percentage < 30) return "from-orange-600 to-orange-700";
        if (percentage < 70) return "from-yellow-600 to-yellow-700";
        return "from-green-600 to-green-700";
    };

    const handleViewDetails = (campaign: ParsedCampaign) => {
        setSelectedCampaign(campaign);
        setShowModal(true);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (!address) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#1c1c24] to-[#2a2a35]">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center bg-[#2c2f32] p-8 rounded-2xl shadow-2xl max-w-md mx-4"
                >
                    <motion.img 
                        src={thirdweb} 
                        className="w-20 h-20 mx-auto mb-6"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    />
                    <h2 className="text-white text-2xl font-bold mb-3">Connect Your Wallet</h2>
                    <p className="text-gray-400 mb-6">Please connect your wallet to view inactive campaigns</p>
                    <CustomButton 
                        btnType="button"
                        title="← Go Back" 
                        handleClick={() => navigate(-1)}
                        styles="bg-gradient-to-r from-[#1dc071] to-[#16a34a] hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                    />
                </motion.div>
            </div>
        );
    }

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#1c1c24] to-[#2a2a35]">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center max-w-md mx-4"
                >
                    <div className="text-red-400 text-6xl mb-4">⚠️</div>
                    <p className="text-red-400 mb-6 font-semibold">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <CustomButton 
                            btnType="button"
                            title="Retry" 
                            handleClick={loadInactiveCampaigns}
                            styles="bg-gradient-to-r from-[#1dc071] to-[#16a34a]"
                        />
                        <CustomButton 
                            btnType="button"
                            title="Go Back" 
                            handleClick={() => navigate(-1)}
                            styles="bg-gray-600 hover:bg-gray-700"
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1c1c24] to-[#2a2a35] py-8 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-7xl mx-auto mb-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#1dc071] to-[#4acd8d] bg-clip-text text-transparent">
                            Inactive Campaigns
                        </h1>
                        <p className="text-gray-400 mt-2">Campaigns that have reached their deadline</p>
                    </div>
                    <div className="flex gap-3">
                        <CustomButton 
                            btnType="button"
                            title="← Back" 
                            handleClick={() => navigate(-1)}
                            styles="bg-gray-700 hover:bg-gray-600 transition-all duration-300"
                        />
                    </div>
                </div>

                {/* Stats Banner */}
                {inactiveCampaigns.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-[#1dc071]/10 to-[#4acd8d]/10 border border-[#1dc071]/30 rounded-xl p-4 mb-6"
                    >
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#1dc071]/20 rounded-full flex items-center justify-center">
                                    <span className="text-[#1dc071] text-xl">📊</span>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Inactive Campaigns</p>
                                    <p className="text-white text-2xl font-bold">{inactiveCampaigns.length}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                    <span className="text-yellow-500 text-xl">💰</span>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Raised</p>
                                    <p className="text-white text-2xl font-bold">
                                        {formatEthAmount(inactiveCampaigns.reduce((sum, c) => sum + parseFloat(c.amountCollected), 0).toString())} ETH
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search and Filter Bar */}
                {inactiveCampaigns.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row gap-4 mb-6"
                    >
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search campaigns by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 pl-11 bg-[#2c2f32] border border-[#3a3a43] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#1dc071] transition-colors duration-300"
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedFilter}
                                onChange={(e) => setSelectedFilter(e.target.value as any)}
                                className="px-4 py-3 bg-[#2c2f32] border border-[#3a3a43] rounded-xl text-white focus:outline-none focus:border-[#1dc071] transition-colors duration-300 cursor-pointer appearance-none pr-10"
                            >
                                <option value="all">All Campaigns</option>
                                <option value="recent">Recently Ended</option>
                                <option value="oldest">Oldest First</option>
                                <option value="mostRaised">Most Raised</option>
                                <option value="leastRaised">Least Raised</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </motion.div>

            {/* Campaign Grid */}
            {filteredCampaigns.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="max-w-7xl mx-auto text-center py-20"
                >
                    <div className="w-24 h-24 mx-auto mb-6 bg-[#2c2f32] rounded-full flex items-center justify-center">
                        <span className="text-4xl">🔍</span>
                    </div>
                    <p className="text-gray-400 text-lg">
                        {searchTerm ? "No campaigns match your search" : "No inactive campaigns found"}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-[#1dc071] hover:underline"
                        >
                            Clear search
                        </button>
                    )}
                </motion.div>
            ) : (
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredCampaigns.map((campaign) => {
                            const raisedPercentage = getRaisedPercentage(campaign.amountCollected, campaign.target);
                            const statusColor = getStatusColor(campaign.amountCollected, campaign.target);
                            
                            return (
                                <motion.div
                                    key={campaign.pId}
                                    variants={cardVariants}
                                    whileHover={{ scale: 1.03 }}
                                    onHoverStart={() => setHoveredCard(campaign.pId)}
                                    onHoverEnd={() => setHoveredCard(null)}
                                    className="bg-[#2c2f32] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                                    onClick={() => handleViewDetails(campaign)}
                                >
                                    {/* Image Container */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={campaign.image}
                                            alt={campaign.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                        
                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <div className="px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
                                                Ended
                                            </div>
                                        </div>

                                        {/* Percentage Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${raisedPercentage}%` }}
                                                transition={{ duration: 1, delay: 0.2 }}
                                                className={`h-full bg-gradient-to-r ${statusColor}`}
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="text-white font-bold text-xl mb-2 line-clamp-1 group-hover:text-[#1dc071] transition-colors duration-300">
                                            {campaign.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                            {campaign.description}
                                        </p>

                                        {/* Stats */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs">Target</span>
                                                <span className="text-white text-sm font-semibold">
                                                    {formatEthAmount(campaign.target)} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs">Raised</span>
                                                <span className="text-red-400 text-sm font-semibold">
                                                    {formatEthAmount(campaign.amountCollected)} ETH
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs">End Date</span>
                                                <span className="text-gray-300 text-sm">
                                                    {new Date(
                                                        campaign.deadline.toString().length === 10
                                                            ? campaign.deadline * 1000
                                                            : campaign.deadline
                                                    ).toLocaleDateString('en-US', { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${raisedPercentage}%` }}
                                                transition={{ duration: 1, delay: 0.3 }}
                                                className={`absolute h-full bg-gradient-to-r ${statusColor}`}
                                            />
                                        </div>

                                        {/* View Details Button */}
                                        <button className="w-full py-2 bg-gray-700 hover:bg-[#1dc071] rounded-lg text-white text-sm font-semibold transition-all duration-300 transform hover:scale-105">
                                            View Details →
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modal for Campaign Details */}
            <AnimatePresence>
                {showModal && selectedCampaign && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#2c2f32] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative">
                                <img 
                                    src={selectedCampaign.image} 
                                    alt={selectedCampaign.title}
                                    className="w-full h-64 object-cover"
                                />
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors duration-300"
                                >
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedCampaign.title}</h2>
                                <p className="text-gray-400 mb-6">{selectedCampaign.description}</p>
                                
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Creator</span>
                                        <span className="text-white font-mono text-sm">
                                            {selectedCampaign.owner.slice(0, 6)}...{selectedCampaign.owner.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Target Amount</span>
                                        <span className="text-white font-semibold">{formatEthAmount(selectedCampaign.target)} ETH</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">Amount Raised</span>
                                        <span className="text-red-400 font-semibold">{formatEthAmount(selectedCampaign.amountCollected)} ETH</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-700">
                                        <span className="text-gray-400">End Date</span>
                                        <span className="text-white">
                                            {new Date(
                                                selectedCampaign.deadline.toString().length === 10
                                                    ? selectedCampaign.deadline * 1000
                                                    : selectedCampaign.deadline
                                            ).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
                                    <p className="text-red-400 text-sm font-semibold mb-2">⚠️ Campaign Ended</p>
                                    <p className="text-gray-300 text-sm">
                                        This campaign has reached its deadline and is no longer accepting donations.
                                        {parseFloat(selectedCampaign.amountCollected) > 0 && " Funds cannot be withdrawn as the campaign did not reach its target."}
                                    </p>
                                </div>

                                <CustomButton
                                    btnType="button"
                                    title="Close"
                                    handleClick={() => setShowModal(false)}
                                    styles="w-full bg-gradient-to-r from-[#1dc071] to-[#16a34a] hover:shadow-lg transition-all duration-300"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
// File: app/(user)/properties/[slug]/page.tsx

"use client";

import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import { notFound } from 'next/navigation';
import groq from 'groq';
import { client as sanityClient } from '@/lib/sanity.client'; // Using 'client' as per your import
import urlBuilder from '@sanity/image-url';
import Image from 'next/image';

// Appwrite
import { databases } from '@/lib/appwrite'; // Added Appwrite databases
import { Query, Models } from 'appwrite';   // Added Appwrite Query and Models

// Auth Context
import { useAuth } from '@/context/AuthContext'; // Added useAuth

// Import your existing components
import TopSection from '../../components/TopSection/TopSection';
import Lightbox from '../../components/LightBox/LightBox';
import Button from '../../components/Button/Button'; // Your existing Button component
import WaitlistPopup from '../../../components/WaitlistPopup/WaitlistPopup';
import './style.scss';

// --- Helper Functions ---
function urlFor(source: any) {
    if (!source?.asset) return '';
    return urlBuilder(sanityClient).image(source).auto('format').fit('max').url();
}

const getImageDimensions = (assetRef: string | undefined): { width: number; height: number } => {
    if (!assetRef) return { width: 800, height: 600 };
    const regex = /-(\d+x\d+)-(\w+)$/;
    const match = assetRef.match(regex);
    if (match && match[1]) {
        const [width, height] = match[1].split('x').map(Number);
        if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
            return { width, height };
        }
    }
    return { width: 800, height: 600 };
};

// --- TypeScript Interfaces (Matching Schema + New Reservation Interface) ---
interface SanityImage {
    _type: 'image';
    asset: { _ref: string; _type: 'reference'; url?: string; };
    alt?: string;
}
interface Amenity { _key: string; text: string; icon: SanityImage; }
interface SqftOption {
    _key: string;
    sqft: number;
    pricePerMonth: number;
}
interface RoomTier {
    _key: string;
    tierName: string;
    image: SanityImage;
    additionalImages?: SanityImage[];
    bunkPricing?: {
        upperBunkPrice?: number | null;
        lowerBunkPrice?: number | null;
        upperBunkBedsLeft?: number | null;
        lowerBunkBedsLeft?: number | null;
    };
    features: string[];
    pricePerMonth: number | null;
    bedsLeft: number;
    sqft?: number;
    sqftOptions?: SqftOption[];
}
interface OccupancyGroup { _key: string; occupancyName: string; tiers: RoomTier[]; }
interface SharedSpace { _key: string; title: string; image: SanityImage; }
type RoomGalleryImage = { src: string; alt: string };
type RoomTierForRender = {
    _key: string;
    tier: string;
    primaryImage: RoomGalleryImage | null;
    galleryImages: RoomGalleryImage[];
    featuresText: string;
    hasFeatureOverflow: boolean;
    hasAdditionalImages: boolean;
    bunkOptions: Array<{ id: 'upper' | 'lower'; label: string; price: number; bedsLeft: number | null }>;
    sqftOptions: Array<{ id: string; sqft: number; label: string; price: number }>;
    basePrice: number;
    price: number;
    bedsLeft: number;
    sqft?: number;
};

interface PropertyDetail {
    _id: string;
    propertyName: string;
    badgeText?: string | null;
    coverImage: SanityImage;
    featuredImage: SanityImage;
    galleryImages?: SanityImage[];
    topSectionTitle: string;
    topSectionSubtext: string;
    propertyLocationText: string;
    bedCount?: string | null;
    bedPostText?: string | null;
    description: string;
    amenities?: Amenity[];
    locationAccess?: string[];
    roomTypes?: OccupancyGroup[];
    locationMapLink?: string;
    sharedSpacesDescription?: string;
    sharedSpaces?: SharedSpace[];
    priceFrom: string; // Kept as string from your original
    priceDescription: string;
    linkedLocation?: {
        name?: string;
    };
}

interface ReservationDocument extends Models.Document {
    userId: string;
    propertyId: string;
    propertyName: string;
    selectedTierKey: string;
    selectedTierName: string;
    occupancyName: string;
    amountPaid: number;
    currency: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature?: string;
    status: string;
    reservationTimestamp: string;
}

// --- GROQ Query ---
const propertyDetailQuery = groq`
  *[_type == "property" && slug.current == $slug && published == true][0] {
    _id, propertyName, coverImage {alt, asset->{_ref, url}},
    featuredImage {alt, asset->{_ref, url}}, galleryImages[]{alt, asset->{_ref, url}},
    badgeText,
    topSectionTitle, topSectionSubtext, propertyLocationText, bedCount, bedPostText, description,
    amenities[]{ _key, text, icon{alt, asset->{_ref, url}} },
    locationAccess,
    linkedLocation->{ name },
    roomTypes[]{ _key, occupancyName, tiers[]{ _key, tierName, features, pricePerMonth, bedsLeft, sqft, sqftOptions[]{_key, sqft, pricePerMonth}, image{alt, asset->{_ref, url}}, additionalImages[]{alt, asset->{_ref, url}}, bunkPricing{upperBunkPrice, lowerBunkPrice, upperBunkBedsLeft, lowerBunkBedsLeft} }},
    locationMapLink, sharedSpacesDescription,
    sharedSpaces[]{ _key, title, image{alt, asset->{_ref, url}} },
    priceFrom, priceDescription
  }
`;

// --- Page Component ---
interface PageProps { params: { slug: string }; }

export default function PropertyDetailPage({ params }: PageProps) {
    const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
    const slug = resolvedParams.slug;
    const { currentUser } = useAuth();

    const [propertyData, setPropertyData] = useState<PropertyDetail | null>(null);
    const [isLoadingProperty, setIsLoadingProperty] = useState(true); // Renamed for clarity
    const [error, setError] = useState<string | null>(null);

    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
    const [roomGalleryLightbox, setRoomGalleryLightbox] = useState<{ images: RoomGalleryImage[]; startIndex: number } | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showAllAmenities, setShowAllAmenities] = useState(false);
    const [showCopyToast, setShowCopyToast] = useState(false);

    const [selectedTierKey, setSelectedTierKey] = useState<string | null>(null);
    const [selectedTierPrice, setSelectedTierPrice] = useState<number | null>(null);
    const [selectedTierBedsLeft, setSelectedTierBedsLeft] = useState<number | null>(null);
    const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
    const [tierBunkSelection, setTierBunkSelection] = useState<Record<string, 'upper' | 'lower'>>({});
    const [openBunkDropdownKey, setOpenBunkDropdownKey] = useState<string | null>(null);
    const [tierSqftSelection, setTierSqftSelection] = useState<Record<string, string>>({});
    const [openSqftDropdownKey, setOpenSqftDropdownKey] = useState<string | null>(null);


    // Booking/Waitlist States
    const [userReservation, setUserReservation] = useState<ReservationDocument | null>(null);
    const [isCheckingReservation, setIsCheckingReservation] = useState(true);
    const [isWaitlistPopupOpen, setIsWaitlistPopupOpen] = useState(false);

    const safePropertyData = propertyData || ({} as PropertyDetail);
    const {
        propertyName,
        coverImage,
        topSectionTitle,
        topSectionSubtext,
        propertyLocationText,
        bedCount,
        bedPostText,
        description: propertyDescription,
        amenities,
        locationAccess,
        roomTypes: sanityRoomTypes,
        locationMapLink,
        sharedSpacesDescription,
        sharedSpaces,
        priceFrom,
        priceDescription: ctaPriceDescription,
        linkedLocation,
    } = safePropertyData;

    const shortLocationFromText = useMemo(() => {
        if (!propertyLocationText) return '';
        const [firstSegment] = propertyLocationText.split(/[|,]/);
        return firstSegment.trim();
    }, [propertyLocationText]);
    const propertyLocationLabelRaw = linkedLocation?.name || shortLocationFromText || propertyLocationText || '';
    const propertyLocationLabel = propertyLocationLabelRaw.replace(/Eranhipaalam/gi, 'Eranhipalam');
    const propertyBedSummary = useMemo(
        () => [bedCount, bedPostText].filter(Boolean).join(' ').trim(),
        [bedCount, bedPostText]
    );

    const waitlistRoomOptions = useMemo(() => {
        if (!propertyData?.roomTypes) return [];
        return propertyData.roomTypes.flatMap(group =>
            (group.tiers || []).map(tier => ({
                id: tier._key,
                label: `${group.occupancyName === 'Double' || group.occupancyName === 'Duo' ? 'Twin' : group.occupancyName} - ${tier.tierName}`,
            }))
        );
    }, [propertyData?.roomTypes]);

    const propertyWaitlistContext = useMemo(() => {
        if (!propertyName) return undefined;
        return {
            propertyName,
            propertyLocationShort: propertyLocationLabel,
            roomTypeOptions: waitlistRoomOptions,
            selectedRoomTypeId: selectedTierKey,
        };
    }, [propertyName, propertyLocationLabel, waitlistRoomOptions, selectedTierKey]);

    const handleShare = useCallback(async () => {
        const currentUrl = window.location.href;
        const title = propertyData?.propertyName || 'Check out this property';
        const text = `Take a look at ${title} on Hubode!`;
        if (navigator.share) {
            try { await navigator.share({ title, text, url: currentUrl }); }
            catch (e) { console.error('Error sharing:', e); }
        } else {
            try {
                await navigator.clipboard.writeText(currentUrl);
                setShowCopyToast(true);
                setTimeout(() => setShowCopyToast(false), 2500);
            } catch (e) { alert('Could not copy link.'); console.error('Failed to copy:', e); }
        }
    }, [propertyData?.propertyName]);

    useEffect(() => {
        let isActive = true;
        const fetchData = async () => {
            setIsLoadingProperty(true);
            setError(null);
            if (!slug) {
                if (isActive) { setError("Property ID missing."); setIsLoadingProperty(false); }
                return;
            }
            try {
                // Using 'client' as per your original import for Sanity
                const data = await sanityClient.fetch<PropertyDetail | null>(propertyDetailQuery, { slug });
                if (!isActive) return;
                setPropertyData(data); // if data is null, !propertyData check will lead to notFound()
            } catch (err) {
                console.error("Fetch property error:", err);
                if (isActive) setError("Failed to load property details.");
            } finally {
                if (isActive) setIsLoadingProperty(false);
            }
        };
        fetchData();
        window.scrollTo(0, 0);
        return () => { isActive = false; };
    }, [slug]);

    useEffect(() => {
        const checkExistingReservation = async () => {
            if (!currentUser || !propertyData?._id || !selectedTierKey) {
                setUserReservation(null);
                setIsCheckingReservation(false);
                return;
            }
            setIsCheckingReservation(true);
            try {
                const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
                const COLL_ID = process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!;
                const response = await databases.listDocuments<ReservationDocument>(DB_ID, COLL_ID, [
                    Query.equal('userId', currentUser.$id),
                    Query.equal('propertyId', propertyData._id),
                    Query.equal('selectedTierKey', selectedTierKey),
                    Query.equal('status', 'CONFIRMED')
                ]);
                setUserReservation(response.total > 0 ? response.documents[0] : null);
            } catch (e) {
                console.error("Check reservation error:", e);
                setUserReservation(null);
            } finally {
                setIsCheckingReservation(false);
            }
        };

        if (currentUser && propertyData) {
            if (selectedTierKey) checkExistingReservation();
            else { setUserReservation(null); setIsCheckingReservation(false); }
        } else {
            setIsCheckingReservation(false);
        }
    }, [currentUser, propertyData, selectedTierKey]);

    const allGalleryImagesForLightbox = useMemo(() => {
        if (!propertyData) return [];
        const images = [];
        if (propertyData.featuredImage?.asset) {
            images.push({ src: urlFor(propertyData.featuredImage), alt: propertyData.featuredImage.alt || 'Featured' });
        }
        propertyData.galleryImages?.forEach(img => {
            if (img?.asset) images.push({ src: urlFor(img), alt: img.alt || 'Gallery' });
        });
        return images;
    }, [propertyData]);

    const featuredGalleryImage = allGalleryImagesForLightbox?.[0] ?? null;
    const gridGalleryImages = allGalleryImagesForLightbox?.slice(1, 5) ?? [];

    const amenitiesToShow = useMemo(() => {
        const initialVisible = 6;
        const allAmenities = propertyData?.amenities || [];
        // Your original filter logic for amenities was commented out, respecting that.
        // If you need to filter invalid amenities, uncomment and adjust:
        // const validAmenities = allAmenities.filter(a => a.text && a.icon?.asset?._ref);
        const validAmenities = allAmenities;
        return showAllAmenities ? validAmenities : validAmenities.slice(0, initialVisible);
    }, [propertyData?.amenities, showAllAmenities]);

    const roomTypeDataForRender = useMemo(() => {
        if (!propertyData?.roomTypes) return {};
        return propertyData.roomTypes.reduce((acc, group) => {
            if (group.occupancyName && group.tiers) {
                acc[group.occupancyName] = group.tiers.map(tier => {
                    const galleryImages: RoomGalleryImage[] = [];
                    const featureItems = Array.isArray(tier.features) ? tier.features : [];
                    if (tier.image?.asset) {
                        galleryImages.push({
                            src: urlFor(tier.image),
                            alt: tier.image.alt || `${group.occupancyName} - ${tier.tierName}`,
                        });
                    }
                    const bunkOptions: Array<{ id: 'upper' | 'lower'; label: string; price: number; bedsLeft: number | null }> = [];
                    if (typeof tier.bunkPricing?.upperBunkPrice === 'number' && tier.bunkPricing.upperBunkPrice > 0) {
                        bunkOptions.push({
                            id: 'upper',
                            label: `Upper Bunk – ₹${tier.bunkPricing.upperBunkPrice.toLocaleString('en-IN')} / month`,
                            price: tier.bunkPricing.upperBunkPrice,
                            bedsLeft: typeof tier.bunkPricing.upperBunkBedsLeft === 'number' ? tier.bunkPricing.upperBunkBedsLeft : null,
                        });
                    }
                    if (typeof tier.bunkPricing?.lowerBunkPrice === 'number' && tier.bunkPricing.lowerBunkPrice > 0) {
                        bunkOptions.push({
                            id: 'lower',
                            label: `Lower Bunk – ₹${tier.bunkPricing.lowerBunkPrice.toLocaleString('en-IN')} / month`,
                            price: tier.bunkPricing.lowerBunkPrice,
                            bedsLeft: typeof tier.bunkPricing.lowerBunkBedsLeft === 'number' ? tier.bunkPricing.lowerBunkBedsLeft : null,
                        });
                    }
                    const sqftOptions: Array<{ id: string; sqft: number; label: string; price: number }> = [];
                    const basePrice = typeof tier.pricePerMonth === 'number' ? tier.pricePerMonth : 0;
                    if (typeof tier.sqft === 'number' && tier.sqft > 0) {
                        const basePriceLabel = typeof tier.pricePerMonth === 'number'
                            ? ` \u2013 \u20B9${tier.pricePerMonth.toLocaleString('en-IN')} / month`
                            : '';
                        sqftOptions.push({
                            id: `base-${tier._key}`,
                            sqft: tier.sqft,
                            price: basePrice,
                            label: `${tier.sqft} Sq. Ft.${basePriceLabel}`,
                        });
                    }
                    tier.sqftOptions?.forEach((option) => {
                        if (typeof option?.sqft === 'number' && option.sqft > 0 && typeof option.pricePerMonth === 'number' && option.pricePerMonth > 0) {
                            sqftOptions.push({
                                id: option._key || `${tier._key}-sqft-${option.sqft}`,
                                sqft: option.sqft,
                                price: option.pricePerMonth,
                                label: `${option.sqft} Sq. Ft. – ₹${option.pricePerMonth.toLocaleString('en-IN')} / month`,
                            });
                        }
                    });
                    let hasAdditionalImages = false;
                    tier.additionalImages?.forEach((img) => {
                        if (img?.asset) {
                            hasAdditionalImages = true;
                            galleryImages.push({
                                src: urlFor(img),
                                alt: img.alt || `${group.occupancyName} - ${tier.tierName}`,
                            });
                        }
                    });
                    return {
                        _key: tier._key,
                        tier: tier.tierName,
                        primaryImage: galleryImages[0] || null,
                        galleryImages,
                        featuresText: featureItems.length ? featureItems.join(' \u2022 ') : 'Features not listed',
                        hasFeatureOverflow: featureItems.length > 3,
                        hasAdditionalImages,
                        bunkOptions,
                        sqftOptions,
                        basePrice,
                        price: basePrice,
                        bedsLeft: tier.bedsLeft,
                        sqft: tier.sqft,
                    };
                });
            }
            return acc;
        }, {} as Record<string, Array<RoomTierForRender>>);
    }, [propertyData?.roomTypes]);

    const lowestTierPrice = useMemo(() => {
        if (!propertyData?.roomTypes) return null;
        const prices: number[] = [];
        propertyData.roomTypes.forEach((group) => {
            group.tiers?.forEach((tier) => {
                if (typeof tier.pricePerMonth === 'number') prices.push(tier.pricePerMonth);
                if (typeof tier.bunkPricing?.upperBunkPrice === 'number') prices.push(tier.bunkPricing.upperBunkPrice);
                if (typeof tier.bunkPricing?.lowerBunkPrice === 'number') prices.push(tier.bunkPricing.lowerBunkPrice);
                tier.sqftOptions?.forEach((option) => {
                    if (typeof option?.pricePerMonth === 'number') prices.push(option.pricePerMonth);
                });
            });
        });
        return prices.length ? Math.min(...prices) : null;
    }, [propertyData?.roomTypes]);

    const tierLookup = useMemo(() => {
        const map: Record<string, RoomTierForRender> = {};
        Object.values(roomTypeDataForRender).forEach((tiers) => {
            tiers?.forEach((tier) => {
                map[tier._key] = tier;
            });
        });
        return map;
    }, [roomTypeDataForRender]);

    const openLightbox = (index: number) => { setIsLightboxOpen(true); setLightboxStartIndex(index); };
    const closeLightbox = () => { setIsLightboxOpen(false); };
    const openRoomGallery = useCallback((images: RoomGalleryImage[], startIndex = 0) => {
        if (!images || images.length === 0) return;
        setRoomGalleryLightbox({ images, startIndex });
    }, []);
    const closeRoomGallery = useCallback(() => setRoomGalleryLightbox(null), []);
    const toggleDescription = () => { setIsDescriptionExpanded(!isDescriptionExpanded); };
    const toggleAmenitiesView = () => { setShowAllAmenities(!showAllAmenities); };
    const toggleRoomFeaturesView = useCallback((tierKey: string) => {
        setExpandedFeatures((prev) => ({
            ...prev,
            [tierKey]: !prev[tierKey],
        }));
    }, []);

    const getTierPriceForDisplay = useCallback((tier: RoomTierForRender) => {
        if (!tier) return 0;
        const sqftSelection = tierSqftSelection[tier._key];
        const selectedSqft = tier.sqftOptions.find((option) => option.id === sqftSelection) ?? tier.sqftOptions[0];
        const sqftPrice = selectedSqft?.price ?? tier.basePrice ?? 0;
        if (tier.bunkOptions.length === 0) return sqftPrice;
        const selection = tierBunkSelection[tier._key];
        const found = tier.bunkOptions.find((option) => option.id === selection);
        return found?.price ?? tier.bunkOptions[0]?.price ?? sqftPrice;
    }, [tierBunkSelection, tierSqftSelection]);

    const handleSelectTier = useCallback((tierKey: string, tierPrice: number, bedsLeft: number) => {
        if (selectedTierKey === tierKey) {
            setSelectedTierKey(null);
            setSelectedTierPrice(null);
            setSelectedTierBedsLeft(null);
        } else {
            setSelectedTierKey(tierKey);
            setSelectedTierPrice(tierPrice);
            setSelectedTierBedsLeft(bedsLeft);
        }
    }, [selectedTierKey]);

    const handleScrollToRooms = useCallback((event?: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        event?.preventDefault();
        const targetElement = document.getElementById('room-types');
        if (targetElement) {
            const HEADER_HEIGHT = 80; const PADDING_ABOVE = 20;
            const offset = HEADER_HEIGHT + PADDING_ABOVE;
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }, []);

    const handleBookNow = () => {
        if (!selectedTierKey) {
            handleScrollToRooms();
            return;
        }
        setIsWaitlistPopupOpen(true);
    };

    useEffect(() => {
        if (!selectedTierKey) {
            setIsWaitlistPopupOpen(false);
        }
    }, [selectedTierKey]);

    useEffect(() => {
        setRoomGalleryLightbox(null);
        setExpandedFeatures({});
        setTierBunkSelection({});
        setOpenBunkDropdownKey(null);
        setTierSqftSelection({});
        setOpenSqftDropdownKey(null);
    }, [propertyData?._id]);

    useEffect(() => {
        const handleDocumentClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            const isInsideSelector = target?.closest('.roomtype-bunk-selector') || target?.closest('.roomtype-sqft-selector');
            if (!isInsideSelector) {
                setOpenBunkDropdownKey(null);
                setOpenSqftDropdownKey(null);
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenBunkDropdownKey(null);
                setOpenSqftDropdownKey(null);
            }
        };

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        if (!selectedTierKey) return;
        const tier = tierLookup[selectedTierKey];
        if (!tier) return;
        const updatedPrice = getTierPriceForDisplay(tier);
        setSelectedTierPrice(updatedPrice);
        if (tier.bunkOptions.length > 0) {
            const selection = tierBunkSelection[tier._key] ?? tier.bunkOptions[0]?.id;
            const selectedOption = tier.bunkOptions.find((option) => option.id === selection) ?? tier.bunkOptions[0];
            if (selectedOption && typeof selectedOption.bedsLeft === 'number') {
                setSelectedTierBedsLeft(selectedOption.bedsLeft);
            } else {
                setSelectedTierBedsLeft(tier.bedsLeft);
            }
        } else {
            setSelectedTierBedsLeft(tier.bedsLeft);
        }
    }, [selectedTierKey, tierLookup, tierBunkSelection, tierSqftSelection, getTierPriceForDisplay]);

    if (isLoadingProperty) {
        return (
            <div className="property-loading-container">
                <div className="loading-gif-container">
                    <img src="/images/buffering-icon.gif" alt="Loading..." className="loading-gif" />
                </div>
            </div>
        );
    }
    if (error) return <div className="error-container"><p>{error}</p></div>;
    if (!propertyData) { notFound(); return null; }

    const availableOccupancyTypes = Object.keys(roomTypeDataForRender);
    const mapEmbedSrc = locationMapLink?.match(/src="([^"]+)"/)?.[1] || '';

    // Determine current selected tier object to check bedsLeft for disabling CTA
    return (
        <div>
            <TopSection title={topSectionTitle} subtext={topSectionSubtext} backgroundImageUrl={urlFor(coverImage)} />

            {allGalleryImagesForLightbox.length > 0 && (
                <div className="images-container-main flex items-center justify-center">
                    <div className="images-container container">
                        <div className="left-section">
                            {featuredGalleryImage && (
                                <div className="featured-image img-item" onClick={() => openLightbox(0)}>
                                    <img src={featuredGalleryImage.src} alt={featuredGalleryImage.alt} />
                                    {propertyData?.badgeText && (
                                        <span className="property-badge">{propertyData.badgeText}</span>
                                    )}
                                </div> )}
                        </div>
                        <div className="right-section">
                            {gridGalleryImages.map((image, index) => (
                                <div className={`image img-item image${index + 1}`} key={image.src + index} onClick={() => openLightbox(index + 1)}>
                                    <img src={image.src} alt={image.alt} />
                                    {index === gridGalleryImages.length - 1 && (
                                        <div className="all-image-icon" onClick={(e) => { e.stopPropagation(); openLightbox(index + 1); }}>
                                            <img src="/images/camera-white.svg" alt="Gallery icon" />
                                            <span>{allGalleryImagesForLightbox.length}</span>
                                        </div> )}
                                </div> ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="main-content-container-outer flex items-center justify-center margin-bottom">
                <div className="main-content-container container">
                    <div className="left-content-section">
                        <div className="head-section">
                            <div className="property-header">
                                <h1>{propertyName}</h1>
                                <button className="share-button" onClick={handleShare}>
                                    <img src="/images/share-icon-white.svg" alt="Share"/> Share
                                </button>
                            </div>
                            <div className="property-location detail-row">
                                <img src="/images/location-green.svg" alt="Location"/> <p>{propertyLocationText}</p>
                            </div>
                            {propertyBedSummary && (
                                <div className="property-bed-info detail-row">
                                    <img src="/images/bed-icon-green.svg" alt="Bed availability" /> <p>{propertyBedSummary}</p>
                                </div>
                            )}
                            <div className="property-room-types detail-row">
                                {availableOccupancyTypes.map((type) => {
                                    const occupancyLabel = (type === "Double" || type === "Duo") ? "Twin" : type;
                                    let iconSrc = "/images/single-icon.svg"; // Ensure these paths are correct
                                    if (type === "Duo" || type === "Double" || type === "Twin") iconSrc = "/images/double-icon.svg";
                                    if (type === "4 Sharing") iconSrc = "/images/4-icon.svg";
                                    return (<div className="type" key={type}><img src={iconSrc} alt={`${occupancyLabel} icon`} /><p>{occupancyLabel}</p></div>);
                                })}
                            </div>
                        </div>

                        {propertyDescription && (
                            <div className="description-section">
                                <h4>Description</h4>
                                <p className={`description-text ${isDescriptionExpanded ? 'expanded' : ''}`}>{propertyDescription}</p>
                                {propertyDescription.length > 250 && (
                                    <button onClick={toggleDescription} className="read-more-button">
                                        Read {isDescriptionExpanded ? 'Less' : 'More'}
                                        <img src="/images/down-arrow-green.svg" alt="" className={`arrow ${isDescriptionExpanded ? 'up' : ''}`}/>
                                    </button> )}
                            </div>
                        )}

                        {amenitiesToShow && amenitiesToShow.length > 0 && (
                            <div className={`description-section features-section ${showAllAmenities ? 'expanded' : ''}`}>
                                <h4>Features / Amenities</h4>
                                <div className="features-items-container">
                                    {amenitiesToShow.map((amenity) => (
                                        <div className="feature-item" key={amenity._key}>
                                            <div className="feature-icon-container">
                                                <img src={urlFor(amenity.icon)} alt={amenity.icon.alt || amenity.text} className="feature-icon" width={24} height={24} />
                                            </div>
                                            <p>{amenity.text}</p>
                                        </div> ))}
                                </div>
                                {propertyData?.amenities && propertyData.amenities.length > 6 && (
                                    <button onClick={toggleAmenitiesView} className="view-all-amenities-button">
                                        {showAllAmenities ? 'View Less' : 'View All'}
                                    </button> )}
                            </div>
                        )}

                        {locationAccess && locationAccess.length > 0 && (
                            <div className="description-section location-access-section">
                                <h4>Location Access</h4>
                                <div className="locations-container">
                                    {locationAccess.map((locationText, index) => (
                                        <div className="location-item" key={index}>
                                            <img src="/images/pin-green.svg" alt="Pin" /> <p>{locationText}</p>
                                        </div> ))}
                                </div>
                            </div>
                        )}

                        {availableOccupancyTypes.length > 0 && (
                            <div id="room-types" className="description-section roomtype-section">
                                <h4>Abode Collections</h4>
                                {availableOccupancyTypes.map((occupancyType) => {
                                    const occupancyLabel = (occupancyType === "Double" || occupancyType === "Duo") ? "Twin" : occupancyType;
                                    return (
                                   <div className={`roomtype-group ${occupancyType.toLowerCase().replace(/\s+/g, '-')}-group`} key={occupancyType}>
                                        <h5 className="roomtype-group-heading">{occupancyLabel}</h5>
                                        <div className="roomtype-row">
                                            {roomTypeDataForRender[occupancyType]?.map((tier) => {
                                                const isSelected = selectedTierKey === tier._key;
                                                const hasGalleryImages = tier.galleryImages.length > 0;
                                                const showGalleryIndicator = tier.hasAdditionalImages;
                                                const isFeaturesExpanded = Boolean(expandedFeatures[tier._key]);
                                                const previewImage = tier.primaryImage;
                                                const displayPrice = getTierPriceForDisplay(tier);
                                                const currentBunkValue = tierBunkSelection[tier._key] ?? tier.bunkOptions[0]?.id;
                                                const selectedBunkOption = tier.bunkOptions.find((option) => option.id === currentBunkValue) ?? tier.bunkOptions[0];
                                                const selectedBunkBedsLeft = (tier.bunkOptions.length > 0 && selectedBunkOption)
                                                    ? (typeof selectedBunkOption.bedsLeft === 'number' ? selectedBunkOption.bedsLeft : null)
                                                    : null;
                                                const effectiveBedsLeft = (selectedTierKey === tier._key && selectedTierBedsLeft !== null)
                                                    ? selectedTierBedsLeft
                                                    : (selectedBunkBedsLeft !== null ? selectedBunkBedsLeft : tier.bedsLeft);
                                                const isDropdownOpen = openBunkDropdownKey === tier._key;
                                                const bunkLabelId = `bunk-label-${tier._key}`;
                                                const dropdownMenuId = `bunk-dropdown-menu-${tier._key}`;
                                                const dropdownTriggerId = `bunk-trigger-${tier._key}`;
                                                const hasSqftOptions = tier.sqftOptions.length > 1;
                                                const currentSqftValue = tierSqftSelection[tier._key] ?? tier.sqftOptions[0]?.id;
                                                const selectedSqftOption = tier.sqftOptions.find((option) => option.id === currentSqftValue) ?? tier.sqftOptions[0];
                                                const isSqftDropdownOpen = openSqftDropdownKey === tier._key;
                                                const sqftLabelId = `sqft-label-${tier._key}`;
                                                const sqftDropdownMenuId = `sqft-dropdown-menu-${tier._key}`;
                                                const sqftDropdownTriggerId = `sqft-trigger-${tier._key}`;

                                                return (
                                                    <div
                                                        className={`roomtype-item ${isSelected ? 'selected' : ''} ${effectiveBedsLeft === 0 ? 'no-beds' : ''}`}
                                                        key={tier._key}
                                                        onClick={effectiveBedsLeft > 0 ? () => handleSelectTier(tier._key, displayPrice, effectiveBedsLeft) : undefined}
                                                    >
                                                        <div className={`roomtype-item-image ${hasGalleryImages ? 'has-gallery' : ''}`}>
                                                            {previewImage && (
                                                                <button
                                                                    type="button"
                                                                    className="roomtype-image-button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        if (tier.galleryImages.length > 0) {
                                                                            openRoomGallery(tier.galleryImages, 0);
                                                                        }
                                                                    }}
                                                                    aria-label={`View ${tier.tier} images`}
                                                                >
                                                                    <Image
                                                                        src={previewImage.src}
                                                                        alt={previewImage.alt}
                                                                        fill
                                                                        style={{ objectFit: 'cover' }}
                                                                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 300px"
                                                                    />
                                                                    <span className="roomtype-image-overlay" aria-hidden="true" />
                                                                    {showGalleryIndicator && (
                                                                        <span className="roomtype-gallery-indicator" aria-hidden="true">
                                                                            <img src="/images/camera-white.svg" alt="" />
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            )}
                                                            {effectiveBedsLeft === 0 && <div className="sold-out-overlay"><span>Fully Booked</span></div>}
                                                        </div>
                                                        <div className="roomtype-item-content">
                                                            <h6 className='roomtype-item-title'>{tier.tier}</h6>
                                                            {!hasSqftOptions && selectedSqftOption?.sqft && (
                                                                <p className="room-sqft">Sq. Ft.: {selectedSqftOption.sqft}</p>
                                                            )}
                                                            <p className={`room-features ${tier.hasFeatureOverflow ? (isFeaturesExpanded ? 'expanded' : 'collapsed') : ''}`}>
                                                                {tier.featuresText}
                                                            </p>
                                                            {tier.hasFeatureOverflow && (
                                                                <button
                                                                    type="button"
                                                                    className="room-features-toggle"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        toggleRoomFeaturesView(tier._key);
                                                                    }}
                                                                >
                                                                    View {isFeaturesExpanded ? 'Less' : 'More'}
                                                                    <img src="/images/down-arrow-green.svg" alt="" className={`arrow ${isFeaturesExpanded ? 'up' : ''}`} />
                                                                </button>
                                                            )}
                                                            {hasSqftOptions && (
                                                                <div
                                                                    className={`roomtype-sqft-selector ${isSqftDropdownOpen ? 'open' : ''}`}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <label id={sqftLabelId} className="bunk-dropdown-label">Sq. Ft. Preference</label>
                                                                    <button
                                                                        type="button"
                                                                        id={sqftDropdownTriggerId}
                                                                        className="bunk-dropdown-trigger"
                                                                        aria-haspopup="listbox"
                                                                        aria-expanded={isSqftDropdownOpen}
                                                                        aria-labelledby={`${sqftLabelId} ${sqftDropdownTriggerId}`}
                                                                        aria-controls={sqftDropdownMenuId}
                                                                        onClick={(event) => {
                                                                            event.preventDefault();
                                                                            event.stopPropagation();
                                                                            setOpenBunkDropdownKey(null);
                                                                            setOpenSqftDropdownKey((prev) => (prev === tier._key ? null : tier._key));
                                                                        }}
                                                                    >
                                                                        <span>{selectedSqftOption?.label ?? 'Select Option'}</span>
                                                                        <span className="dropdown-icon" aria-hidden="true" />
                                                                    </button>
                                                                    <div
                                                                        id={sqftDropdownMenuId}
                                                                        className={`bunk-dropdown-menu ${isSqftDropdownOpen ? 'open' : ''}`}
                                                                        role="listbox"
                                                                        aria-labelledby={sqftLabelId}
                                                                    >
                                                                        {tier.sqftOptions.map((option) => {
                                                                            const isSelectedOption = option.id === selectedSqftOption?.id;
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={option.id}
                                                                                    className={`bunk-dropdown-option ${isSelectedOption ? 'selected' : ''}`}
                                                                                    role="option"
                                                                                    aria-selected={isSelectedOption}
                                                                                    onClick={(event) => {
                                                                                        event.preventDefault();
                                                                                        event.stopPropagation();
                                                                                        setTierSqftSelection((prev) => ({ ...prev, [tier._key]: option.id }));
                                                                                        if (selectedTierKey === tier._key) {
                                                                                            const basePrice = option.price ?? tier.basePrice ?? 0;
                                                                                            const bunkSelection = tierBunkSelection[tier._key];
                                                                                            const bunkOption = tier.bunkOptions.find((entry) => entry.id === bunkSelection) ?? tier.bunkOptions[0];
                                                                                            const nextPrice = bunkOption?.price ?? basePrice;
                                                                                            setSelectedTierPrice(nextPrice);
                                                                                        }
                                                                                        setOpenSqftDropdownKey(null);
                                                                                    }}
                                                                                >
                                                                                    <span>{option.label}</span>
                                                                                    {isSelectedOption && (
                                                                                        <span className="check-indicator" aria-hidden="true">
                                                                                            <img src="/images/check-green.svg" alt="" />
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {tier.bunkOptions.length > 0 && (
                                                                <div
                                                                    className={`roomtype-bunk-selector ${isDropdownOpen ? 'open' : ''}`}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                >
                                                                    <label id={bunkLabelId} className="bunk-dropdown-label">Bunk Preference</label>
                                                                    <button
                                                                        type="button"
                                                                        id={dropdownTriggerId}
                                                                        className="bunk-dropdown-trigger"
                                                                        aria-haspopup="listbox"
                                                                        aria-expanded={isDropdownOpen}
                                                                        aria-labelledby={`${bunkLabelId} ${dropdownTriggerId}`}
                                                                        aria-controls={dropdownMenuId}
                                                                        onClick={(event) => {
                                                                            event.preventDefault();
                                                                            event.stopPropagation();
                                                                            setOpenSqftDropdownKey(null);
                                                                            setOpenBunkDropdownKey((prev) => (prev === tier._key ? null : tier._key));
                                                                        }}
                                                                    >
                                                                        <span>{selectedBunkOption?.label ?? 'Select Option'}</span>
                                                                        <span className="dropdown-icon" aria-hidden="true" />
                                                                    </button>
                                                                    <div
                                                                        id={dropdownMenuId}
                                                                        className={`bunk-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}
                                                                        role="listbox"
                                                                        aria-labelledby={bunkLabelId}
                                                                    >
                                                                        {tier.bunkOptions.map((option) => {
                                                                            const isSelectedOption = option.id === selectedBunkOption?.id;
                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={option.id}
                                                                                    className={`bunk-dropdown-option ${isSelectedOption ? 'selected' : ''}`}
                                                                                    role="option"
                                                                                    aria-selected={isSelectedOption}
                                                                                    onClick={(event) => {
                                                                                        event.preventDefault();
                                                                                        event.stopPropagation();
                                                                                        const nextValue = option.id;
                                                                                        setTierBunkSelection((prev) => ({ ...prev, [tier._key]: nextValue }));
                                                                                        if (selectedTierKey === tier._key) {
                                                                                            const nextPrice = option.price ?? tier.basePrice;
                                                                                            setSelectedTierPrice(nextPrice);
                                                                                            if (typeof option.bedsLeft === 'number') {
                                                                                                setSelectedTierBedsLeft(option.bedsLeft);
                                                                                            } else {
                                                                                                setSelectedTierBedsLeft(tier.bedsLeft);
                                                                                            }
                                                                                        }
                                                                                        setOpenBunkDropdownKey(null);
                                                                                    }}
                                                                                >
                                                                                    <span>{option.label}</span>
                                                                                    {isSelectedOption && (
                                                                                        <span className="check-indicator" aria-hidden="true">
                                                                                            <img src="/images/check-green.svg" alt="" />
                                                                                        </span>
                                                                                    )}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <p className="price"> <span>₹{displayPrice.toLocaleString('en-IN')}</span> / month </p>
                                                            <p className={`beds-left ${effectiveBedsLeft === 0 ? 'no-beds-text' : ''}`}>
                                                                Only {effectiveBedsLeft > 0 ? `${effectiveBedsLeft} Bed${effectiveBedsLeft !== 1 ? 's' : ''} Left` : 'No Beds Left'}
                                                            </p>
                                                            <button
                                                                className={`select-button ${isSelected ? 'selected' : ''}`}
                                                                disabled={effectiveBedsLeft === 0}
                                                                onClick={effectiveBedsLeft > 0 ? () => handleSelectTier(tier._key, displayPrice, effectiveBedsLeft) : undefined}
                                                            >
                                                                {effectiveBedsLeft === 0 ? 'Unavailable' : (isSelected ? 'Selected' : 'Select')}
                                                            </button>
                                                        </div>
                                                    </div> );
                                            })}
                                        </div>
                                   </div>
                                );
                               })}
                            </div>
                        )}

                        {mapEmbedSrc && (
                            <div className="description-section location-map">
                                <h4>Location</h4>
                                <div className="map-container">
                                    <iframe src={mapEmbedSrc} width="600" height="450" style={{ border: 0, width: '100%', display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={`${propertyName} Map`}></iframe>
                                </div>
                            </div>
                        )}

                        {sharedSpaces && sharedSpaces.length > 0 && (
                            <div className="description-section shared-spaces-container">
                                <h4>Hub</h4>
                                {sharedSpacesDescription && <p>{sharedSpacesDescription}</p>}
                                <div className="shared-items-container">
                                    {sharedSpaces.map((space) => (
                                        <div className="shared-item" key={space._key} style={{ backgroundImage: `url(${urlFor(space.image)})` }}>
                                            <p>{space.title}</p>
                                        </div> ))}
                                </div>
                            </div>
                        )}
                    </div> {/* End left-content-section */}

                   {/* === START: REVISED RIGHT STICKY SECTION === */}
                    <div className="right-sticky-section">
                        <div className="roomtype-cta-container">
                            <div className="price">
                                <p>{selectedTierPrice !== null ? (<>Selected Tier: <span>₹{selectedTierPrice.toLocaleString('en-IN')}</span> /month</>) : (<>From <span>₹{lowestTierPrice !== null ? lowestTierPrice.toLocaleString('en-IN') : (propertyData?.priceFrom || '')}</span> /month</>)}</p>
                            </div>
                            <p className="cta-prebook-note">Early access pricing is available exclusively to waitlist members</p>

                            {isCheckingReservation ? ( <p className="cta-subtext loading-reservation">Checking reservation status...</p>
                            ) : userReservation && userReservation.selectedTierKey === selectedTierKey ? (<>
                                <p className="cta-subtext-booked">Request received! Our team will contact you for next steps.</p>
                                <Button text="Already Joined" className="cta-button booked" disabled={true} />
                            </>) : (<>
                                <p className="cta-subtext">
                                    {selectedTierKey
                                        ? `Join the waitlist for this room type and we'll reach out as soon as it's available.`
                                        : 'Select your preferred room type to join the waitlist and get priority access when bookings open. A minimum stay of 3 months applies.'}
                                </p>
                                <Button
                                    text={selectedTierKey ? "Join Waitlist" : "Select room type"}
                                    href={!selectedTierKey ? "#room-types" : undefined}
                                    className="cta-button"
                                    onClick={selectedTierKey ? handleBookNow : handleScrollToRooms}
                                />
                            </>)}
                        </div>
                    </div>
                    {/* === END: REVISED RIGHT STICKY SECTION === */}
                </div> {/* End main-content-container */}
            </div> {/* End main-content-container-outer */}

            {isLightboxOpen && (
                <Lightbox images={allGalleryImagesForLightbox} startIndex={lightboxStartIndex} onClose={closeLightbox} />
            )}
            {roomGalleryLightbox && (
                <Lightbox images={roomGalleryLightbox.images} startIndex={roomGalleryLightbox.startIndex} onClose={closeRoomGallery} />
            )}
            {showCopyToast && (<div className="copy-toast">Link copied to clipboard!</div>)}
            <WaitlistPopup
                isVisible={isWaitlistPopupOpen}
                onClose={() => setIsWaitlistPopupOpen(false)}
                mode="property"
                source="roombooking"
                propertyContext={propertyWaitlistContext}
            />

        </div>
    );
};

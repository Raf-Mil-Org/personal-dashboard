// Tag color mapping utility for PrimeVue Tag component
// Colors are chosen to be semantically meaningful and visually distinct

export const getTagColor = (tag) => {
    if (!tag) return 'secondary';
    
    const tagLower = tag.toLowerCase();
    
    // Food & Groceries - Green tones
    if (tagLower.includes('grocery') || tagLower.includes('food') || tagLower.includes('restaurant') || tagLower.includes('dining')) {
        return 'success';
    }
    
    // Transport & Travel - Blue tones
    if (tagLower.includes('transport') || tagLower.includes('travel') || tagLower.includes('fuel') || tagLower.includes('uber') || tagLower.includes('taxi')) {
        return 'info';
    }
    
    // Health & Wellness - Purple tones
    if (tagLower.includes('health') || tagLower.includes('wellness') || tagLower.includes('medical') || tagLower.includes('pharmacy') || tagLower.includes('fitness')) {
        return 'help';
    }
    
    // Shopping & Retail - Orange tones
    if (tagLower.includes('shopping') || tagLower.includes('clothes') || tagLower.includes('electronics') || tagLower.includes('store')) {
        return 'warning';
    }
    
    // Entertainment & Leisure - Pink tones
    if (tagLower.includes('entertainment') || tagLower.includes('leisure') || tagLower.includes('movie') || tagLower.includes('game') || tagLower.includes('sport')) {
        return 'danger';
    }
    
    // Housing & Utilities - Brown tones
    if (tagLower.includes('housing') || tagLower.includes('utilities') || tagLower.includes('mortgage') || tagLower.includes('rent') || tagLower.includes('electricity')) {
        return 'secondary';
    }
    
    // Income & Savings - Green tones
    if (tagLower.includes('income') || tagLower.includes('salary') || tagLower.includes('savings') || tagLower.includes('investment')) {
        return 'success';
    }
    
    // Insurance & Subscriptions - Blue tones
    if (tagLower.includes('insurance') || tagLower.includes('subscription') || tagLower.includes('premium')) {
        return 'info';
    }
    
    // Default color for other tags
    return 'primary';
};

// Get tag icon based on tag type
export const getTagIcon = (tag) => {
    if (!tag) return 'pi pi-tag';
    
    const tagLower = tag.toLowerCase();
    
    // Food & Groceries
    if (tagLower.includes('grocery') || tagLower.includes('food') || tagLower.includes('restaurant') || tagLower.includes('dining')) {
        return 'pi pi-shopping-cart';
    }
    
    // Transport & Travel
    if (tagLower.includes('transport') || tagLower.includes('travel') || tagLower.includes('fuel') || tagLower.includes('uber') || tagLower.includes('taxi')) {
        return 'pi pi-car';
    }
    
    // Health & Wellness
    if (tagLower.includes('health') || tagLower.includes('wellness') || tagLower.includes('medical') || tagLower.includes('pharmacy') || tagLower.includes('fitness')) {
        return 'pi pi-heart';
    }
    
    // Shopping & Retail
    if (tagLower.includes('shopping') || tagLower.includes('clothes') || tagLower.includes('electronics') || tagLower.includes('store')) {
        return 'pi pi-shopping-bag';
    }
    
    // Entertainment & Leisure
    if (tagLower.includes('entertainment') || tagLower.includes('leisure') || tagLower.includes('movie') || tagLower.includes('game') || tagLower.includes('sport')) {
        return 'pi pi-star';
    }
    
    // Housing & Utilities
    if (tagLower.includes('housing') || tagLower.includes('utilities') || tagLower.includes('mortgage') || tagLower.includes('rent') || tagLower.includes('electricity')) {
        return 'pi pi-home';
    }
    
    // Income & Savings
    if (tagLower.includes('income') || tagLower.includes('salary') || tagLower.includes('savings') || tagLower.includes('investment')) {
        return 'pi pi-dollar';
    }
    
    // Insurance & Subscriptions
    if (tagLower.includes('insurance') || tagLower.includes('subscription') || tagLower.includes('premium')) {
        return 'pi pi-shield';
    }
    
    // Default icon
    return 'pi pi-tag';
};

// Get tag severity for PrimeVue Tag component
export const getTagSeverity = (tag, customTags = []) => {
    // Check if it's a custom tag first
    const customTag = customTags.find(ct => ct.name === tag);
    if (customTag) {
        return customTag.color;
    }
    
    return getTagColor(tag);
};

// Get tag value (display text)
export const getTagValue = (tag) => {
    if (!tag) return 'Untagged';
    return tag;
}; 
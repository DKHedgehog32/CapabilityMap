/**
 * ============================================================
 * colorThemes.js
 * ============================================================
 * @description    Phase-based color utilities for capability sizing
 *                 Generates gradient shades from a base color
 * 
 * @author         Cobra CRM B.V.
 * @version        2.1.0
 * 
 * CHANGELOG:
 * v2.1.0  2024-12-16  Support custom colors per map
 * v2.0.0  2024-12-16  Phase-based color themes
 * ============================================================
 */

// Default phase colors (used when no custom colors defined)
export const DEFAULT_PHASE_COLORS = {
    'Phase 1': '#0176D3',    // Blue
    'Phase 2': '#8B5CF6',    // Purple
    'Phase 3': '#10B981',    // Emerald
    'Phase 4': '#F97316',    // Orange
    'Future': '#6B7280',     // Gray
    'Out of Scope': '#EF4444' // Red
};

/**
 * Generate shades from a base color
 * Returns object with colors for each size from darkest (XS) to lightest (XXXL)
 */
export function generateColorShades(hexColor) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Generate shades - from darker to lighter
    const shades = {
        'XS':   adjustBrightness(r, g, b, -0.5),   // Very dark
        'S':    adjustBrightness(r, g, b, -0.35),  // Dark
        'M':    adjustBrightness(r, g, b, -0.15),  // Slightly dark
        'L':    hexColor,                           // Base color
        'XL':   adjustBrightness(r, g, b, 0.25),   // Light
        'XXL':  adjustBrightness(r, g, b, 0.5),    // Lighter
        'XXXL': adjustBrightness(r, g, b, 0.7),    // Very light
        'TBD':  '#E8E8E8'                          // Gray
    };
    
    return shades;
}

/**
 * Adjust brightness of a color
 * factor: negative = darker, positive = lighter
 */
function adjustBrightness(r, g, b, factor) {
    if (factor < 0) {
        // Darken
        r = Math.round(r * (1 + factor));
        g = Math.round(g * (1 + factor));
        b = Math.round(b * (1 + factor));
    } else {
        // Lighten
        r = Math.round(r + (255 - r) * factor);
        g = Math.round(g + (255 - g) * factor);
        b = Math.round(b + (255 - b) * factor);
    }
    
    // Clamp values
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

/**
 * Get text color (white or dark) based on background brightness
 */
export function getTextColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#242424' : '#FFFFFF';
}

/**
 * Get colors for a capability based on phase, size, and custom phase colors
 * @param phase - The capability's phase
 * @param size - The capability's size (XS, S, M, L, XL, XXL, XXXL, TBD)
 * @param customPhaseColors - Map of phase name to hex color (optional)
 */
export function getCapabilityColors(phase, size, customPhaseColors = {}) {
    // Get base color for phase
    let baseColor = customPhaseColors[phase] || DEFAULT_PHASE_COLORS[phase] || '#9CA3AF';
    
    // Generate shades from base color
    const shades = generateColorShades(baseColor);
    
    // Get background color for this size
    const backgroundColor = shades[size] || shades['TBD'];
    
    // Get appropriate text color
    const textColor = getTextColor(backgroundColor);
    
    return { backgroundColor, textColor };
}
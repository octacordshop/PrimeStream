// Format runtime from minutes to hours and minutes
export function formatRuntime(minutes?: string | number): string {
  if (!minutes) return 'Unknown runtime';
  
  const mins = typeof minutes === 'string' ? parseInt(minutes) : minutes;
  
  if (isNaN(mins)) return minutes.toString();
  
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
}

// Format release date
export function formatReleaseDate(date?: string): string {
  if (!date) return '';
  
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return formattedDate;
  } catch (error) {
    return date;
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
}

// Generate a random color from the theme palette
export function getRandomColor(): string {
  const colors = [
    'bg-prime-blue',
    'bg-prime-teal',
    'bg-blue-600',
    'bg-purple-600',
    'bg-pink-600',
    'bg-red-600',
    'bg-amber-600',
    'bg-emerald-600'
  ];
  
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

// Create initial letters avatar from name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const words = name.split(' ');
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Format time from seconds to MM:SS or HH:MM:SS
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

// Calculate progress percentage
export function calculateProgress(current: number, total: number): number {
  if (isNaN(current) || isNaN(total) || total <= 0) return 0;
  
  const percentage = (current / total) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
}

// Check if an object is empty
export function isEmptyObject(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

// Parse IMDB ID from various formats
export function parseImdbId(id: string): string {
  if (!id) return '';
  
  // If it already has the 'tt' prefix, return as is
  if (id.startsWith('tt')) return id;
  
  // If it's just numbers, add the prefix
  if (/^\d+$/.test(id)) return `tt${id}`;
  
  return id;
}

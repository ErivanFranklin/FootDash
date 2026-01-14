import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ShareService {
  constructor(private toast: ToastController) {}

  /**
   * Share content using native Web Share API if available,
   * otherwise fall back to clipboard copy
   */
  async share(data: { title?: string; text?: string; url?: string }) {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          await this.showToast('Failed to share', 'danger');
        }
        return false;
      }
    } else {
      // Fallback: copy to clipboard
      return await this.copyToClipboard(data);
    }
  }

  /**
   * Check if Web Share API is available
   */
  isShareSupported(): boolean {
    return !!navigator.share;
  }

  /**
   * Share match details
   */
  async shareMatch(match: any) {
    const homeTeam = this.getTeamName(match.teams?.home || match.homeTeam);
    const awayTeam = this.getTeamName(match.teams?.away || match.awayTeam);
    const score = this.getScore(match);
    const date = this.getMatchDate(match);
    
    const title = `${homeTeam} vs ${awayTeam}`;
    const text = score 
      ? `${title}\nScore: ${score}\n${date}`
      : `${title}\n${date}`;
    
    // In a real app, this would be the actual match URL
    const url = window.location.origin + `/match/${match.fixture?.id || match.id}`;
    
    return await this.share({ title, text, url });
  }

  /**
   * Fallback: Copy to clipboard
   */
  private async copyToClipboard(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    const textToCopy = [
      data.title,
      data.text,
      data.url
    ].filter(Boolean).join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      await this.showToast('Copied to clipboard', 'success');
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      await this.showToast('Failed to copy', 'danger');
      return false;
    }
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toast.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private getTeamName(team: any): string {
    return team?.name || team?.team?.name || 'Unknown';
  }

  private getScore(match: any): string {
    const homeScore = match.goals?.home ?? match.score?.fulltime?.home ?? match.homeScore;
    const awayScore = match.goals?.away ?? match.score?.fulltime?.away ?? match.awayScore;
    
    if (homeScore !== undefined && awayScore !== undefined) {
      return `${homeScore} - ${awayScore}`;
    }
    return '';
  }

  private getMatchDate(match: any): string {
    const date = match.fixture?.date || match.date || match.utcDate;
    if (date) {
      return new Date(date).toLocaleString();
    }
    return '';
  }
}

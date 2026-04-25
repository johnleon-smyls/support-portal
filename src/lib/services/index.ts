import type { ITicketService, IArticleService } from './types';
import { TicketService } from './ticket-service';
import { ArticleService } from './article-service';

let ticketService: ITicketService | null = null;
let articleService: IArticleService | null = null;

export function getTicketService(): ITicketService {
  if (!ticketService) {
    ticketService = new TicketService();
  }
  return ticketService;
}

export function getArticleService(): IArticleService {
  if (!articleService) {
    articleService = new ArticleService();
  }
  return articleService;
}

export type { ITicketService, IArticleService } from './types';

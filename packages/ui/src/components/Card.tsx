import React, { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

/* ------------------------------------------------------------------ */
/*  Card (root)                                                        */
/* ------------------------------------------------------------------ */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

function CardRoot({ hover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-card border border-surface-border shadow-card rounded-none',
        hover && 'transition-shadow duration-200 hover:shadow-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

CardRoot.displayName = 'Card';

/* ------------------------------------------------------------------ */
/*  Card.Header                                                        */
/* ------------------------------------------------------------------ */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-surface-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}

CardHeader.displayName = 'Card.Header';

/* ------------------------------------------------------------------ */
/*  Card.Body                                                          */
/* ------------------------------------------------------------------ */

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

CardBody.displayName = 'Card.Body';

/* ------------------------------------------------------------------ */
/*  Card.Footer                                                        */
/* ------------------------------------------------------------------ */

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('px-5 py-3 border-t border-surface-border bg-surface-hover', className)}
      {...props}
    >
      {children}
    </div>
  );
}

CardFooter.displayName = 'Card.Footer';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

export default Card;

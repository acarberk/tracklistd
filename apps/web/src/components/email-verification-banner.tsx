'use client';

import { MailWarning } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import { resendVerification } from '@/lib/api/auth';

export function EmailVerificationBanner(): ReactNode {
  const t = useTranslations('auth.verifyBanner');
  const tToast = useTranslations('auth.toast');
  const { user, isAuthenticated } = useUser();
  const [isSending, setIsSending] = useState(false);

  if (!isAuthenticated || !user || user.emailVerified) {
    return null;
  }

  async function handleResend(): Promise<void> {
    if (!user) {
      return;
    }
    setIsSending(true);
    try {
      await resendVerification(user.email);
      toast.success(tToast('verificationResent'));
    } catch {
      toast.error(tToast('verificationResendError'));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="container mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-amber-700 dark:text-amber-300">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {t('message')}{' '}
            <span className="text-muted-foreground">{t('description', { email: user.email })}</span>
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isSending}
          onClick={() => {
            void handleResend();
          }}
        >
          {isSending ? t('resending') : t('resend')}
        </Button>
      </div>
    </div>
  );
}

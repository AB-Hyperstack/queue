'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface FeedbackFormProps {
  ticketId: string;
  orgId: string;
  queueId: string;
}

export default function FeedbackForm({ ticketId, orgId, queueId }: FeedbackFormProps) {
  const t = useTranslations('Feedback');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  // Check if feedback already exists (for page reload)
  useEffect(() => {
    async function checkExisting() {
      const supabase = createClient();
      const { data } = await supabase
        .from('feedback')
        .select('id')
        .eq('ticket_id', ticketId)
        .maybeSingle();

      if (data) {
        setAlreadySubmitted(true);
      }
    }
    checkExisting();
  }, [ticketId]);

  async function handleSubmit() {
    if (rating === 0 || submitting) return;
    setSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.from('feedback').insert({
      ticket_id: ticketId,
      org_id: orgId,
      queue_id: queueId,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
    }
  }

  // Show thank you if already submitted or just submitted
  if (submitted || alreadySubmitted) {
    return (
      <Card className="text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="font-semibold text-gray-900">{t('thankYou')}</p>
        <p className="text-sm text-gray-500 mt-1">{t('thankYouDesc')}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t('rateExperience')}
        </p>

        <StarRating value={rating} onChange={setRating} size="lg" />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          rows={3}
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
            placeholder:text-gray-400 focus:border-blue-500 focus:outline-none
            focus:ring-2 focus:ring-blue-500/20 resize-none"
        />

        <Button
          onClick={handleSubmit}
          disabled={rating === 0}
          loading={submitting}
          className="mt-4 w-full"
        >
          {submitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </Card>
  );
}

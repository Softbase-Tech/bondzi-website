"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { logoutAll } from "@/lib/api/auth";
import { deleteMyAccount } from "@/lib/api/user";
import { marketingPath, POST_LOGOUT_DEFAULT_PATH } from "@/lib/urls";

/**
 * Two irreversible actions grouped so they read as "danger" together:
 *
 *   - Sign out of every device — POST /auth/logout-all + local signOut.
 *   - Delete account — DELETE /users/me (schedules deletion, 90-day
 *     reversal window via re-login). Confirm via typing DELETE so
 *     accidental submits don't wipe the account.
 */
export function DangerZone() {
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const doSignOutAll = () => {
    startTransition(async () => {
      try {
        await logoutAll();
      } catch {
        // Best-effort — proceed with the local session teardown so the
        // user isn't stuck if the backend blip.
      }
      toast.success("Signed out from all devices");
      await signOut({
        redirect: true,
        redirectTo: marketingPath(POST_LOGOUT_DEFAULT_PATH),
      });
    });
  };

  const doDelete = () => {
    startTransition(async () => {
      try {
        await deleteMyAccount();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Couldn't delete account.",
        );
        return;
      }
      toast.success(
        "Account scheduled for deletion. Sign in within 90 days to cancel.",
      );
      await signOut({
        redirect: true,
        redirectTo: marketingPath(POST_LOGOUT_DEFAULT_PATH),
      });
    });
  };

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <div className="space-y-4">
      <Row
        title="Sign out of all devices"
        body="Ends every open session — mobile app, other browsers, everything."
        action={
          <Button
            variant="outline"
            onClick={() => setSignOutOpen(true)}
            leftIcon={<LogOut size={15} />}
          >
            Sign out all
          </Button>
        }
      />

      <Row
        title="Delete account"
        body="Scheduled for deletion — sign in within 90 days to reverse. After that, personal data is permanently anonymised."
        action={
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            leftIcon={<Trash2 size={15} />}
          >
            Delete
          </Button>
        }
      />

      <Dialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out of every device?"
        description="You'll need to sign in again on each device — including this one."
      >
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setSignOutOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button loading={pending} onClick={doSignOutAll}>
            Sign out everywhere
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setConfirmText("");
        }}
        title="Delete your Bondzi account?"
        description="Your progress, XP, and referrals will be scheduled for deletion. Sign back in within 30 days to cancel."
      >
        <Input
          label="Type DELETE to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoComplete="off"
        />
        <DialogActions>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            loading={pending}
            onClick={doDelete}
            disabled={!canDelete}
            leftIcon={<Trash2 size={15} />}
          >
            Delete forever
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function Row({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <div className="font-display text-[15.5px] text-ink leading-tight">
          {title}
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-soft max-w-[52ch]">
          {body}
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

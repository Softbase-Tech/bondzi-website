import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-group loading boundary for every authed page.
 *
 * This file is the tab-switch performance fix: without a loading
 * boundary, tapping Home/Subjects/Quiz/Rank shows NOTHING until the
 * server finishes its data fetches (a full round trip from a Ghanaian
 * phone to the API), which reads as the app hanging. With it, Next
 * paints this skeleton instantly on navigation — and prefetches it for
 * links in the viewport — so the switch feels immediate while the
 * real page streams in.
 */
export default function AuthedLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-10 w-2/3 max-w-sm" />
        <Skeleton className="h-4 w-1/2 max-w-xs" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl hidden lg:block" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

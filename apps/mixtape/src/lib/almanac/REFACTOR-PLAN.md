# Almanac Refactor Plan

## Hooks with inline axiosInstance calls:
1. useGroupEvents.ts - 10 calls
2. useEventAttendees.ts - 1 call
3. useEventRSVP.ts - 1 call
4. useEventRSVPBreakdown.ts - 1 call

## Actions:
1. Add missing functions to almanacApi.ts
2. Update hooks to use almanacApi namespace
3. Remove inline axiosInstance calls

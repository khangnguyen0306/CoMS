import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useWarnOnLeave(shouldBlock) {
  // Chặn sự kiện beforeunload (refresh hoặc đóng tab)
  useEffect(() => {
    if (shouldBlock) {
      const handler = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };
      window.addEventListener('beforeunload', handler);
      return () => window.removeEventListener('beforeunload', handler);
    }
  }, [shouldBlock]);

  // Chặn điều hướng nội bộ
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!shouldBlock) return false; // Không chặn nếu shouldBlock là false
    return currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const ok = window.confirm(
        'Bạn có chắc muốn rời trang? Các thay đổi chưa được lưu sẽ bị mất.'
      );
      if (ok) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);
}
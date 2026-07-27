export function AuthHero() {
  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: '#06060a' }}
    >
      {/* 상단 헤더 영역 — 전체 폭, 자체 높이만큼만 차지. 기타 영역과 완전히 분리된 flex 아이템. */}
      <div className="relative z-10 shrink-0 px-5 pt-24 lg:px-40 lg:pt-28">
        <div className="max-w-lg">
          <h1 className="text-xl leading-tight font-black text-white lg:text-4xl">
            밴드 합주의 모든 것
          </h1>
          <p
            className="mt-4 text-xs leading-relaxed lg:text-base"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            단톡방으로 합주 일정 맞추느라 힘드셨죠? 일정 조율부터 세션 배정, 선곡까지 — 밴디지
            하나로 밴드 운영에 필요한 모든 걸 한 곳에서 관리하세요
          </p>
        </div>
      </div>

      {/* 기타 영역 — 헤더 영역 아래 남은 공간 전부, 전체 폭. overflow-hidden 이라
          기타가 아무리 커도 위 헤더 영역으로는 절대 올라오지 못함. */}
      <div className="relative min-h-0 w-full flex-1 overflow-hidden lg:h-[780px] lg:flex-none">
        {/* 드럼 바닥에 깔리는 그림자 — 스트라이프 패턴 alpha 를 따라가는 drop-shadow 대신
            바닥에 맞춘 별도 솔리드 타원으로 그려야 또렷하게 보임. */}
        <div
          className="pointer-events-none absolute bottom-[8%] left-1/2 h-[16%] w-[70%] -translate-x-1/2 sm:h-[20%] sm:w-[50%]"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%)',
            filter: 'blur(10px)',
          }}
        />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/img/drum_img.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-6 left-1/2 h-[80%] w-auto max-w-none -translate-x-1/2 object-contain opacity-95 max-[600px]:h-[75%] max-[480px]:h-[65%] lg:top-1/2 lg:bottom-auto lg:h-[90%] lg:-translate-y-1/2"
        />
      </div>
    </div>
  );
}

import React from 'react';
import { COLORS, MAX_FLOOR } from '../utils/constants';

interface Props { onClose: () => void; }

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: COLORS.card, borderRadius: '10px', padding: '14px 16px', marginBottom: '10px' }}>
    <h3 style={{ color: COLORS.gold, fontSize: '1rem', marginBottom: '8px' }}>{title}</h3>
    <div style={{ color: COLORS.text, fontSize: '0.85rem', lineHeight: 1.7 }}>{children}</div>
  </div>
);

export const RulesPage: React.FC<Props> = ({ onClose }) => (
  <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2 style={{ color: COLORS.text, fontSize: '1.3rem' }}>📜 規則與機率</h2>
      <button className="btn-secondary" style={{ minWidth: 'auto', padding: '8px 16px' }} onClick={onClose}>返回</button>
    </div>

    <Section title="塔的結構">
      <p>共 {MAX_FLOOR} 層，5 大區域：</p>
      <p>🟢 草原 1-10F → 🟣 迷霧森林 11-20F → 🟠 熔岩地帶 21-30F → 🔴 龍域 31-40F → 🔵 天空塔 41-49F</p>
      <p>到達第 {MAX_FLOOR} 層即獲得 <span style={{ color: COLORS.gold }}>PS5</span></p>
    </Section>

    <Section title="獎品保留規則">
      <p>🏠 <strong>主動下塔</strong>：保留 100% 塔幣 + 15% 獎勵</p>
      <p>💀 <strong>陣亡</strong>：僅保留 <span style={{ color: COLORS.negative }}>20%</span> 塔幣</p>
      <p style={{ color: COLORS.muted, fontSize: '0.8rem' }}>差距 5 倍，每一層都要計算風險！</p>
    </Section>

    <Section title="致命陷阱">
      <p>🐉 <strong>巨龍</strong>：閃避 60% 存活（受傷）/ 對峙 30% 存活（得護盾）</p>
      <p>💥 <strong>地板崩塌</strong>：70% 存活（受傷）</p>
      <p>👾 <strong>寶箱怪</strong>：40% 扣幣 / 35% 致死 / 25% 雙倍獎勵</p>
      <p>🧝‍♂️ <strong>黑暗精靈</strong>：交半數塔幣 或 50/50 賭命</p>
      <p>🌫️ <strong>詛咒迷霧</strong>：不致死，每層扣 10% 塔幣</p>
      <p style={{ color: COLORS.positive }}>🛡️ 護盾可抵擋一次致命陷阱</p>
      <p style={{ color: COLORS.positive }}>🍀 幸運符可提升 20% 存活率</p>
    </Section>

    <Section title="道具">
      <p>🛡️ 護盾（40🪙/59元）— 抵擋一次致命</p>
      <p>🔮 透視鏡（15🪙/35元）— 預覽下 3 層</p>
      <p>👟 加速靴（25🪙）— 跳過下 1 層</p>
      <p>💊 解毒劑（20🪙/29元）— 解除中毒</p>
      <p>🍀 幸運符（50🪙）— 致命存活 +20%</p>
      <p>🪤 哥布林陷阱（30🪙）— 反偷 +25🪙</p>
    </Section>

    <Section title="驗證">
      <p>所有結果由鏈上隨機數（VRF）決定，公開可驗證 ✓</p>
    </Section>
  </div>
);

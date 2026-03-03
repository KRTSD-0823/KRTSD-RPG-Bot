// main.tsでexportした関数などの機能の型をまとめたファイル

import { ComponentType } from "discord.js";
import type { ButtonInteraction, StringSelectMenuComponent } from "discord.js";

// 色の型
declare global {
  interface BotColor {
  // タプル型
  [key: string]: Array<number, number, number>;
  }
}

// setComponentCollector関数の型定義
declare global {
  type ComponentCollectorComponentType = ComponentType.Button | ComponentType.StringSelect;
  type ComponentFilter = (interaction: ButtonInteraction | StringSelectMenuInteraction) => boolean;
  interface ComponentsCollectorOptions {
    componentType: ComponentCollectorComponentType
    filter?: ComponentFilter
  };
}
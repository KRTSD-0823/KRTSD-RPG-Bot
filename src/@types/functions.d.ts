// functions.tsでexportした関数などの機能(引数)の型をまとめたファイル

import { ComponentType } from "discord.js";
import type { ButtonInteraction, StringSelectMenuComponent } from "discord.js";

type BotColorsKey = "default";

// 色の型
declare global {
  type BotColor = {
    // タプル型
    [key in BotColorsKey]: [number, number, number];
  }
}

// createComponentCollector関数の型定義
declare global {
  type ComponentCollectorComponentType = ComponentType.Button | ComponentType.StringSelect;
  type ComponentFilter = (interaction: ButtonInteraction | StringSelectMenuInteraction) => boolean;
  interface ComponentsCollectorOptions {
    componentType: ComponentCollectorComponentType
    filter?: ComponentFilter
  };
}
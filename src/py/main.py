import asyncio
import logging
from typing import List, Dict, TypeVar

from modules.Emuchievements.main import Game
from modules.Emuchievements.main import Plugin as Emuchievements
from modules.MetaDeck.main import Plugin as MetaDeck
from modules.SteamlessTimes.main import Plugin as SteamlessTimes
from settings import SettingsManager

logging.basicConfig(filename="/tmp/emudecky.log",
					format='[EmuDecky] %(asctime)s %(levelname)s %(message)s',
					filemode='w+',
					force=True)
logger = logging.getLogger()
logger.setLevel(logging.INFO)  # can be changed to logging.DEBUG for debugging issues


class Plugin:
	# Emuchievements

	settings: SettingsManager
	modules: Dict[str, bool] = None

	async def Hash(self, path: str) -> str:
		return await Emuchievements.Hash(self, path, "EmuDecky")

	async def Login(self, username: str, api_key: str):
		return await Emuchievements.Login(self, username, api_key)

	async def isLogin(self) -> bool:
		return await Emuchievements.isLogin(self)

	async def Hidden(self, hidden: bool):
		return await Emuchievements.Hidden(self, hidden)

	async def isHidden(self) -> bool:
		return await Emuchievements.isHidden(self)

	async def GetUserRecentlyPlayedGames(self, count: int | None) -> List[Game]:
		return await Emuchievements.GetUserRecentlyPlayedGames(self, count)

	async def GetGameInfoAndUserProgress(self, game_id: int) -> Game:
		return await Emuchievements.GetGameInfoAndUserProgress(self, game_id)

	# SteamlessTimes

	async def on_lifetime_callback(self, data: dict) -> None:
		return await SteamlessTimes.on_lifetime_callback(self, data)

	async def on_game_start_callback(self, idk: int, game_id: str, action: str) -> None:
		return await SteamlessTimes.on_game_start_callback(self, idk, game_id, action)

	async def on_suspend_callback(self) -> None:
		return await SteamlessTimes.on_suspend_callback(self)

	async def on_resume_callback(self) -> None:
		return await SteamlessTimes.on_resume_callback(self)

	async def get_playtimes(self) -> Dict[str, float] | None:
		return await SteamlessTimes.get_playtimes(self)

	async def reset_playtime(self, game_id: str) -> None:
		return await SteamlessTimes.reset_playtime(self, game_id)

	# EmuDecky

	async def get_modules(self) -> Dict[str, bool] | None:
		while Plugin.modules is None:
			await asyncio.sleep(0.1)
		logger.debug(f"Got modules {Plugin.modules}")
		return Plugin.modules

	async def set_modules(self, modules: Dict[str, bool]):
		Plugin.modules = modules
		await Plugin.set_setting(self, "modules", Plugin.modules)

	async def _main(self):
		Plugin.settings = SettingsManager("emudecky")
		await Plugin.read(self)
		if Plugin.modules.get("Emuchievements"):
			await Emuchievements._main(self)
		if Plugin.modules.get("MetaDeck"):
			await MetaDeck._main(self)
		if Plugin.modules.get("SteamlessTimes"):
			await SteamlessTimes._main(self)

	async def _unload(self):
		if Plugin.modules.get("Emuchievements"):
			await Emuchievements._unload(self)
		if Plugin.modules.get("MetaDeck"):
			await MetaDeck._unload(self)
		if Plugin.modules.get("SteamlessTimes"):
			await SteamlessTimes._unload(self)

	async def read(self) -> None:
		Plugin.settings.read()
		Plugin.modules = await Plugin.get_setting(self, "modules", {
			"Emuchievements": True,
			"MetaDeck": True,
			"SteamlessTimes": True
		})

	async def commit(self) -> None:
		await Plugin.set_setting(self, "modules", Plugin.modules)
		Plugin.settings.commit()

	T = TypeVar("T")

	async def get_setting(self, key, default: T) -> T:
		return Plugin.settings.getSetting(key, default)

	async def set_setting(self, key, value: T) -> T:
		Plugin.settings.setSetting(key, value)
		return value

import {
	definePlugin,
	ServerAPI,
	Plugin, PanelSection, PanelSectionRow, ButtonItem, ToggleField
} from "decky-frontend-lib";

import Emuchievements from "./modules/Emuchievements/index"
import MetaDeck from "./modules/MetaDeck/index"
import SteamlessTimes from "./modules/SteamlessTimes/index"
import {useEffect, useState, VFC} from "react";
import {Title} from "./Title";
import {BiGame} from "react-icons/all";
import {cloneDeep} from "lodash-es";

interface ModuleDictionary
{
	[index: string]: boolean
}

async function get_modules(serverAPI: ServerAPI)
{
	return new Promise<ModuleDictionary>(async (resolve, reject) =>
	{
		let result = await serverAPI.callPluginMethod<{}, ModuleDictionary>("get_modules", {});
		if (result.success)
		{
			resolve(result.result);
		} else reject(new Error(result.result));
	});
}

async function set_modules(serverAPI: ServerAPI, modules: ModuleDictionary)
{
	return new Promise<void>(async (resolve, reject) =>
	{
		let result = await serverAPI.callPluginMethod<{
			modules: ModuleDictionary,
		}, void>("set_modules", {
			modules
		});
		if (result.success)
		{
			resolve(result.result);
		} else reject(new Error(result.result));
	});
}

const Content: VFC<{ plugins: () => ({ [index: string]: Plugin | undefined }), serverAPI: ServerAPI }> = ({plugins, serverAPI}) =>
{
	const [path, setPath] = useState("/home");
	const [modules, setModules] = useState<ModuleDictionary>({});

	useEffect(() =>
	{
		get_modules(serverAPI).then(modules =>
		{
			setModules(modules)
		});
	});

	return <div>
		{
			(() =>
			{
				if (path==="/home")
				{
					return <PanelSection title="Modules">
						{
							Object.entries(plugins()).map(value => (
									<div>
										{
											!!value[1] ? <PanelSectionRow key={value[0]}>
														<ToggleField label={
															<div
																	style={{
																		flexGrow: '1'
																	}}
															>
																<ButtonItem
																		layout="below"
																		onClick={() => setPath(`/module/${value[0]}`)}
																		bottomSeparator="none"
																		disabled={!(modules[value[0]] ?? true)}
																>
																	<div style={{
																		display: 'flex',
																		alignItems: 'center',
																		justifyContent: 'space-between'
																	}}>
																		<div>{value[1].icon}</div>
																		<div>{value[0]}</div>
																	</div>
																</ButtonItem>
															</div>} checked={modules[value[0]] ?? true}
														             onChange={checked =>
														             {
															             modules[value[0]] = checked;
															             const newState = cloneDeep(modules);
															             console.log(newState);
															             setModules(newState);
															             set_modules(serverAPI, modules).then(() =>
															             {
																             serverAPI.toaster.toast({
																	             title: "Restart Required",
																	             body: "EmuDecky modules have changed! You must restart to see changes"
																             });
															             });
														             }}/>
													</PanelSectionRow>:
													<PanelSectionRow key={value[0]}>
														<ToggleField label={value[0]}
														             checked={modules[value[0]] ?? true}
														             onChange={checked =>
														             {
															             modules[value[0]] = checked;
															             const newState = cloneDeep(modules);
															             console.log(newState);
															             setModules(newState);
															             set_modules(serverAPI, modules).then(() =>
															             {
																             serverAPI.toaster.toast({
																	             title: "Restart Required",
																	             body: "EmuDecky modules have changed! You must restart to see changes"
																             });
															             });
														             }}/>
													</PanelSectionRow>
										}
									</div>
							))
						}
					</PanelSection>
				} else if (path.includes("/module/"))
				{
					return plugins()[path.replace("/module/", "")]?.content
				} else
				{
					return <div/>
				}
			})()
		}
	</div>
}

export default definePlugin((serverApi: ServerAPI) =>
{

	let plugins: {[index: string]: Plugin | undefined} = {}
	get_modules(serverApi).then(modules =>
	{
		plugins["Emuchievements"] = modules["Emuchievements"] ?? true ? Emuchievements(serverApi) : undefined;
		plugins["MetaDeck"] = modules["MetaDeck"] ?? true ? MetaDeck(serverApi) : undefined;
		plugins["SteamlessTimes"] = modules["SteamlessTimes"] ?? true ? SteamlessTimes(serverApi) : undefined;
	});

	const pluginsGetter: () => ({ [index: string]: Plugin | undefined }) = () =>
	{
		return plugins
	};

	return {
		title: <Title>EmuDecky</Title>,
		content: <Content plugins={pluginsGetter} serverAPI={serverApi}/>,
		icon: <BiGame/>,
		onDismount()
		{
			Object.values(plugins).forEach(value =>
			{
				if (value && value.onDismount)
					value.onDismount()
			});
		},
	};
});

<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Modal from '$lib/components/common/Modal.svelte';
	import { generateSecret, totp } from '$lib/utils/totp';
	import QRCode from 'qrcode';


	const i18n = getContext('i18n');
	export let show = false;
	let totpSecret = '';
	let canvas;

	onMount(async () => {
		totpSecret = generateSecret();
		console.log('secret', totpSecret);

	});
	$: if (canvas && totpSecret) {
		QRCode.toCanvas(canvas, 'otpauth://totp/openwebui?secret=' + totpSecret);
	}

	// QRCode
	let onCodeEnter = async (a: KeyboardEvent) => {
		let value = a.currentTarget.value.replace(' ', '');
		if (value.match('^\\d{6}$')) {
			console.log("enter!!", value);
			var code = await totp(totpSecret)
			if (value === code) {
				console.log("matches!!");
			} else {
				console.log("no match");
			}
		}
	}
	let openQR = () => {
		window.open('otpauth://totp/openwebui?secret=' + totpSecret)
	};


</script>

<Modal bind:show>
	<div>
		<div class=" flex justify-between dark:text-gray-300 px-5 pt-4 pb-1">
			<div class=" text-lg font-medium self-center">{$i18n.t('Memory')}</div>
			<button
				class="self-center"
				on:click={() => {
					show = false;
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-5 h-5"
				>
					<path
						d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
					/>
				</svg>
			</button>
		</div>

		<div class="flex flex-col w-full px-5 pb-5 dark:text-gray-200">
			<div
				class="flex flex-col w-full items-center  h-[28rem] max-h-screen outline outline-1 rounded-xl outline-gray-100 dark:outline-gray-800 mb-4 mt-1">
				<canvas bind:this={canvas} on:click={openQR}>
				</canvas>
				{totpSecret}
				<input class="w-full rounded-lg py-2 px-4 text-sm dark:text-gray-300 dark:bg-gray-850 outline-none" on:keyup={onCodeEnter} type="text">
			</div>
		</div>
	</div>
</Modal>
function ageString(age: number, moon: number) {
    return moon == 0 ? `${age}歲` : `${age}歲${moon}月`
}
function getFloat2(v: number): string {
    return v.toFixed(2)
}
class View {
    readonly age_ = $("#age")
    readonly die_ = $("#die")
    readonly pay_ = $("#pay")
    readonly pays_ = $("#pays")
    readonly wait_ = $("#wait")
    readonly get_ = $("#get")
    readonly bank_ = $("#bank")

    readonly go_ = $("#go")
    readonly reset_ = $("#reset")
    readonly err_ = $("#err")
    readonly year_ = $("#year")
    readonly moon_ = $("#moon")

    readonly end_ = $("#end")
    constructor() { }
    reset() {
        this.age_.val(30)
        this.die_.val(110)
        this.pay_.val(340)
        this.pays_.val(15 * 12)
        this.wait_.val((65 - 30) * 12)
        this.get_.val(1400)
        this.bank_.val(3)
    }
    enable() {
        this.age_.prop('disabled', false)
        this.die_.prop('disabled', false)
        this.pay_.prop('disabled', false)
        this.pays_.prop('disabled', false)
        this.wait_.prop('disabled', false)
        this.get_.prop('disabled', false)
        this.bank_.prop('disabled', false)

        this.go_.prop('disabled', false)
        this.reset_.prop('disabled', false)
        this.year_.prop('disabled', false)
        this.moon_.prop('disabled', false)
    }
    disable() {
        this.age_.prop('disabled', true)
        this.die_.prop('disabled', true)
        this.pay_.prop('disabled', true)
        this.pays_.prop('disabled', true)
        this.wait_.prop('disabled', true)
        this.get_.prop('disabled', true)
        this.bank_.prop('disabled', true)

        this.go_.prop('disabled', true)
        this.reset_.prop('disabled', true)
        this.year_.prop('disabled', true)
        this.moon_.prop('disabled', true)
    }
    clear() {
        this.err_.html('')
        this.year_.html('')
        this.moon_.html('')
        this.end_.html('')
        this.clear_ = true
    }
    private clear_ = true
    push(opts: {
        age: number,
        moon: number,
        assets: number,
        bankAssets: number,
        bank: number,
        total: number,
    }) {
        if (this.clear_) {
            this.clear_ = false
            const html = `<tr>
<td>年齡</td>
<td>社保資產</td>
<td>銀行資產</td>
<td>銀行利息</td>
<td>合計領取</td></tr>`
            this.year_.html(html)
            this.moon_.html(html)
        }
        const age = ageString(opts.age, opts.moon)
        const gethtml = (val: number) => {
            return `<tr>
<td>${age}</td>
<td>${getFloat2(opts.assets)}</td>
<td>${getFloat2(opts.bankAssets)}</td>
<td>${getFloat2(val)}</td>
<td>${getFloat2(opts.total)}</td>
</tr>`
        }
        this.moon_.append(gethtml(opts.bank))
        this.totalBank_ += opts.bank
        if (opts.moon == 0 ||
            (opts.assets <= 0 && opts.bankAssets <= 0)) {
            this.year_.append(gethtml(this.totalBank_))
            this.totalBank_ = 0
        }
    }
    totalBank_ = 0
    end(text: string) {
        this.end_.html(text)
    }
}
function getNumber(val: any): number | undefined {
    if (val === undefined || val === null) {
        return undefined
    }
    if (typeof val === "number") {
        return Number.isSafeInteger(val) ? val : 0
    } else if (typeof val === "string") {
        try {
            const v = parseInt(val.trim())
            return Number.isSafeInteger(v) ? v : undefined
        } catch (_) {
        }
    }

    return undefined
}
function getFloat(val: any): number | undefined {
    if (val === undefined || val === null) {
        return undefined
    }
    if (typeof val === "number") {
        return isFinite(val) && val > 0 ? val : undefined
    } else if (typeof val === "string") {
        try {
            const v = parseFloat(val.trim())
            return isFinite(v) && v > 0 ? v : undefined
        } catch (_) {
        }
    }

    return undefined
}
class Calculator {
    age: number
    die: number
    pay: number
    pays: number
    wait: number
    get: number
    bank: number
    interest = 0
    constructor(readonly view: View) {
        const age = getNumber(view.age_.val())
        if (age === undefined || age < 0) {
            throw new Error("請輸入有效的 當前年齡")
        }
        const die = getNumber(view.die_.val())
        if (die === undefined || age < 0) {
            throw new Error("請輸入有效的 死亡年齡")
        }
        if (die < age) {
            throw new Error("死亡年齡 必須 大於等於 當前年齡")
        }
        const pay = getNumber(view.pay_.val())
        if (pay === undefined || pay < 1) {
            throw new Error("請輸入有效的 每月支出")
        }
        const pays = getNumber(view.pays_.val())
        if (pays === undefined || pay < 1) {
            throw new Error("請輸入有效的 買入多少個月")
        }
        const wait = getNumber(view.wait_.val())
        if (wait === undefined || wait < 1) {
            throw new Error("請輸入有效的 等待多少月")
        }
        if (wait <= pays) {
            throw new Error("等待月數必須大於等於買入月數")
        }
        const get = getNumber(view.get_.val())
        if (get === undefined || get < 1) {
            throw new Error("請輸入有效的 每月領取")
        }
        const bank = getFloat(view.bank_.val()) ?? 0
        if (bank < 0) {
            throw new Error("請輸入有效的 銀行利息")
        }

        this.age = age * 12
        this.die = die
        this.pay = pay
        this.pays = pays
        this.wait = wait
        this.get = get
        this.bank = bank
    }
    // 社保資產
    assets = 0
    // 銀行資產
    bankAssets = 0
    // 總計領取了多少錢
    totalGet = 0
    setend = false
    async next() {
        const moon = this.age % 12;
        const age = Math.floor(this.age / 12)

        // 計算銀行利息
        let bank = 0
        if (this.bankAssets > 0 && this.bank > 0) {
            bank = this.bankAssets * this.bank / 12 / 100
            this.bankAssets += bank
        }

        // 添加支付到資產
        if (this.pays > 0) {
            this.pays--

            this.assets += this.pay
            this.bankAssets += this.pay
        }

        // 計算社保領錢
        if (this.wait > 0) {
            this.wait--
        } else {
            this.assets -= this.get
            this.bankAssets -= this.get
            this.totalGet += this.get
        }
        this.view.push(
            {
                age: age,
                moon: moon,
                assets: this.assets,
                bankAssets: this.bankAssets,
                bank: bank,
                total: this.totalGet,
            })
        if (this.assets <= 0 && this.bankAssets <= 0) {
            if (!this.setend) {
                this.view.end(`和存銀行比起來，你要活超到 ${age} 歲才比較划算。`)
                this.setend = true
            }
            return true
        }
        if (moon == 0 && age >= this.die) {
            if (!this.setend) {
                this.view.end(`真是大傻瓜，這筆錢如果存在銀行到死了時(${this.die}歲)也用不完`)
                this.setend = true
            }
            return true
        }
        if (!this.setend
            && bank > 0
            && bank >= this.get) {
            this.view.end(`真是大傻瓜，從 ${ageString(age, moon)} 開始銀行每月利息都夠付你每月領取的養老金了`)
            this.setend = true
        }

        // 避免cpu佔用 100%
        if (age % 20 == 0) {
            await new Promise((resolve) => setTimeout(resolve, 1))
        }
        this.age++
        return false
    }
}

$(window).on("load", () => {
    const view = new View()
    view.reset()
    view.reset_.on("click", () => {
        view.reset()
    })
    view.go_.on("click", async () => {
        view.disable()
        try {
            view.clear()
            const calculator = new Calculator(view)
            while (true) {
                if (await calculator.next()) {
                    break
                }
            }
        } catch (e) {
            console.log(e)
            view.err_.text(`${e}`)

        } finally {
            view.enable()
        }
    })
})
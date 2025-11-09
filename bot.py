from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaAnimation
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
import openai
import random

# ✅ OpenRouter API кілтіңді қой
openai.api_key = "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"
openai.api_base = "https://openrouter.ai/api/v1"

# ✅ Telegram Bot токеніңді қой
TELEGRAM_TOKEN = "8447341753:AAGBlDfW5bEHfEpcDu0vjRW9VlZgjMG02Kk"


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("Сәлем 😄 Сұрағыңды жаз да жібер!")


def add_flair(text: str) -> str:
    emojis = ["😊", "😉", "🤓", "🔥", "💡", "✨"]
    return text + " " + random.choice(emojis)


async def ask_type(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data["question"] = update.message.text
    keyboard = [
        [InlineKeyboardButton("Қысқа 📝", callback_data="short")],
        [InlineKeyboardButton("Ұзақ 📚", callback_data="long")]
    ]
    await update.message.reply_text("Жауап форматын таңда:", reply_markup=InlineKeyboardMarkup(keyboard))


async def answer(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    question = context.user_data["question"]
    mode = query.data

    style = "қысқа" if mode == "short" else "толық түсіндірумен"

    prompt = f"Сен жылы, эмоциялы сөйлейтін мұғалімсің. Жауапты {style} бер. Сұрақ: {question}"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-5-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        text = add_flair(response.choices[0].message["content"])
    except Exception as e:
        text = f"Қате 😢: {e}"

    await query.edit_message_text(text)


if __name__ == "__main__":
    app = ApplicationBuilder().token(TELEGRAM_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, ask_type))
    app.add_handler(CallbackQueryHandler(answer))

    print("✅ Бот іске қосылды!")
    app.run_polling()
